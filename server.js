require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing for API requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for active STK push transactions
const transactions = new Map();

// Helper to determine M-PESA API base URL
const getMpesaBaseUrl = () => {
  return (process.env.MPESA_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

// Step 1: Generate M-PESA Access Token (OAuth 2.0)
async function getMpesaAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY || '';
  const secret = process.env.MPESA_CONSUMER_SECRET || '';

  if (!key || !secret || key.includes('YOUR_') || secret.includes('YOUR_')) {
    throw new Error('M-PESA Consumer Key or Secret is not configured in .env');
  }

  const credentials = Buffer.from(`${key}:${secret}`).toString('base64');
  const baseUrl = getMpesaBaseUrl();

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate M-PESA Access Token: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Step 2: Trigger Lipa Na M-PESA Online STK Push
app.post('/api/boosts/paye', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  // Format Phone Number to Safaricom standard (2547XXXXXXXX or 2541XXXXXXXX)
  let cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('7')) {
    cleanPhone = '254' + cleanPhone;
  } else if (cleanPhone.startsWith('1')) {
    cleanPhone = '254' + cleanPhone;
  }

  if (!cleanPhone.match(/^254[17]\d{8}$/)) {
    return res.status(400).json({ success: false, error: 'Invalid Kenyan phone number format. Must be 07XX... or 01XX...' });
  }

  try {
    const shortcode = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback';
    
    // Amount is default Ksh 100 as per Chat Na Wazungu activation fee
    const payAmount = amount || 100;

    // Generate Daraja Timestamp: YYYYMMDDHHmmss
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    
    // Generate Password: base64(ShortCode + PassKey + Timestamp)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Get live Access Token
    const accessToken = await getMpesaAccessToken();
    const baseUrl = getMpesaBaseUrl();

    console.log(`[M-PESA] Initiating STK Push for ${cleanPhone} of Ksh ${payAmount}...`);

    const mpesaRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: payAmount,
        PartyA: cleanPhone,
        PartyB: shortcode,
        PhoneNumber: cleanPhone,
        CallBackURL: callbackUrl,
        AccountReference: 'ChatNaWazungu',
        TransactionDesc: 'Premium Account Onboarding Fee'
      })
    });

    const result = await mpesaRes.json();

    if (!mpesaRes.ok || result.ResponseCode !== '0') {
      console.error(`[M-PESA] Safaricom returned failure:`, result);
      return res.status(400).json({
        success: false,
        error: result.ResponseDescription || 'Safaricom STK Push request rejected.'
      });
    }

    const checkoutRequestId = result.CheckoutRequestID;
    console.log(`[M-PESA] STK Push successfully sent to ${cleanPhone}. CheckoutRequestID: ${checkoutRequestId}`);

    // Store pending transaction state
    transactions.set(checkoutRequestId, {
      checkoutRequestId,
      merchantRequestId: result.MerchantRequestID,
      status: 'PENDING',
      paid: false,
      phone: cleanPhone,
      amount: payAmount,
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      boostId: checkoutRequestId,
      message: 'STK push initiated successfully.'
    });

  } catch (error) {
    console.error(`[M-PESA] STK Push Exception:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server failed to connect to Safaricom Daraja API.'
    });
  }
});

// Step 3: Webhook to receive M-PESA Callback from Safaricom
app.post('/api/mpesa/callback', (req, res) => {
  console.log('[M-PESA Callback] Received transaction update:', JSON.stringify(req.body, null, 2));

  try {
    const callbackData = req.body.Body;
    if (!callbackData || !callbackData.stkCallback) {
      return res.status(400).send('Invalid Callback Payload');
    }

    const callback = callbackData.stkCallback;
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    const tx = transactions.get(checkoutRequestId);

    if (tx) {
      if (resultCode === 0) {
        console.log(`[M-PESA Callback] Payment SUCCESS for ${tx.phone} of Ksh ${tx.amount}. TXN ID: ${checkoutRequestId}`);
        tx.status = 'COMPLETED';
        tx.paid = true;
      } else {
        console.warn(`[M-PESA Callback] Payment FAILED (${resultCode}: ${resultDesc}) for ${tx.phone}`);
        tx.status = 'FAILED';
        tx.paid = false;
      }
      transactions.set(checkoutRequestId, tx);
    } else {
      console.warn(`[M-PESA Callback] Transaction reference not found in server cache: ${checkoutRequestId}`);
      // Store it anyway for client checking
      transactions.set(checkoutRequestId, {
        checkoutRequestId,
        status: resultCode === 0 ? 'COMPLETED' : 'FAILED',
        paid: resultCode === 0,
        timestamp: new Date()
      });
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed successfully.' });

  } catch (error) {
    console.error(`[M-PESA Callback] Callback Processing Error:`, error.message);
    return res.status(500).send('Internal Server Error processing callback.');
  }
});

// Step 4: Polling endpoint for client verification
app.get('/api/boosts/:id', (req, res) => {
  const checkoutRequestId = req.params.id;
  const tx = transactions.get(checkoutRequestId);

  if (!tx) {
    // If not found in cache, default to pending (Safaricom takes time to process)
    return res.status(200).json({
      success: true,
      paid: false,
      paymentStatus: 'PENDING'
    });
  }

  return res.status(200).json({
    success: true,
    paid: tx.paid,
    paymentStatus: tx.status
  });
});

// Catch-all route to serve index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view your app!`);
});
