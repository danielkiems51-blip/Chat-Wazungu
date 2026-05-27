# Walkthrough - Chat Na Wazungu Premium Clone

We have successfully built a premium, highly-interactive, responsive single-page web application that replicates the onboarding flow of the original **Chat Na Wazungu** and dramatically improves upon it by introducing a fully-functional **Earning Dashboard** and M-PESA payment integration.

---

## 🌟 Key Features Implemented

### 1. Glowing Ambient Dark-Theme Landing Page
- Deep, immersive indigo/slate dark-mode palette using HSL variables.
- Drifting, glowing animated background blobs to capture immediate attention.
- Premium typography using `Plus Jakarta Sans`.
- Modern, clean landing layout presenting active wazungu counts, testimonials, stats grids, and features cards.

### 2. Interactive Multi-Step Onboarding Wizard
- **Step 1: Registration Form** - User display name, email, country, and password input with real-time field validation. Displays a glowing custom bonus invitation badge ("Invited by Mzunye").
- **Step 2: M-PESA Payment Activation** - Connects to the **real Safaricom Daraja API** endpoint used in the original app (`https://newfliza.onrender.com/api/boosts/paye`) and polls for successful completions.
- **Dual-Mode Sandbox Switch** - An advanced toggle at the top allows users to bypass Safaricom and test the STK Push prompt securely using simulated Daraja logs.
- **Step 3: Verification Success** - High-fidelity vector animated tick and celebration card.

### 3. Fully Interactive Simulated Earnings Dashboard
- **Overview Dashboard** - Real-time statistics counters tracking balance, total earnings, active chats, and affiliate income.
- **Live Chat Portal** - Select incoming chat requests from Wazungus ("Sarah 🇺🇸", "Hans 🇩🇪", "Chloe 🇬🇧") with custom avatars and countries.
- **Interactive AI Chat Bot** - Click "Accept Chat" to engage in a conversation. Type and send messages to watch your balance increase. The Wazungu will type (`Wazungu is typing...`) and reply dynamically!
- **Satisfying Earning Animations** - Floating money indicators (`+$0.15 🪙`) drift and fade away with every message sent.
- **Affiliate Center** - Generates copyable referral links (`/?ref=username`) and monitors active sub-agents.
- **Withdrawal Terminal** - Request M-PESA, PayPal, or Binance Pay withdrawals. Available balances update instantly, logging transaction rows that automatically transition to "Completed" status after 8 seconds.
- **Training & Marketing Hub** - Strategic copywriting guides for agents.

---

## 🚀 How to Deploy on Render

Deploying this application on [Render](https://render.com) is free and takes less than 3 minutes.

### Step 1: Code Pushed to GitHub
The codebase has already been successfully initialized, configured, and pushed to your remote repository:
**[https://github.com/danielkiems51-blip/Chat-Wazungu.git](https://github.com/danielkiems51-blip/Chat-Wazungu.git)**
There is no need to run git setup steps manually. All code files, templates, styles, and configurations are live in your repository branch `main`.

### Step 2: Set Up Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New** (top right) ➡️ **Web Service**.
3. Connect your GitHub account and select your `chatnawazungu-premium` repository.
4. Configure the Web Service settings:
   - **Name**: `chat-na-wazungu` (or any custom name)
   - **Region**: Select the region closest to you (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` (Standard free plan)
5. Configure Environment Variables (in Render under **Environment** tab):
   - Add `MPESA_ENV` with value `sandbox` (for testing) or `production` (for live).
   - Add `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` from your Safaricom Developer Portal.
   - Add `MPESA_BUSINESS_SHORTCODE` (defaults to `174379` in Sandbox).
   - Add `MPESA_PASSKEY` (defaults to `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` in Sandbox).
   - Add `MPESA_CALLBACK_URL` with value `https://chat-na-wazungu.onrender.com/api/mpesa/callback` (replace with your actual Render domain!).
6. Click **Deploy Web Service**. Render will build and deploy your service, giving you a live URL like `https://chat-na-wazungu.onrender.com`!

---

## 🔍 How to Verify Locally

While waiting for your Render deployment, you can run and verify the app on your local system:

1. Launch the server:
   ```bash
   node server.js
   ```
2. Open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)
3. Fill out the registration form.
4. Keep **Developer Sandbox Mode** checked on the payment page, enter a phone number, and hit Pay to bypass verification immediately.
5. In the Dashboard:
   - Go to **Overview**, click **Accept Chat** on Sarah's card.
   - Go to **Live Chat**, send messages, watch your balance increment in real-time, and read Sarah's auto-responses.
   - Go to **Withdrawals**, request a withdrawal of $10.00 to M-PESA, and watch the status change to completed in the transaction log!
