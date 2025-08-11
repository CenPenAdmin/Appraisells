// payment.js - Pi Network auction registration payment
console.log('💰 Payment page loaded');

let currentPaymentId = null;
let piUser = null;

// Initialize Pi SDK
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Initializing Pi SDK...');
  
  try {
    Pi.init({ 
      version: "2.0", 
      sandbox: true 
    });
    
    updateDebugInfo('debugSdkStatus', 'Initialized ✓');
    console.log('✅ Pi SDK initialized');
    
    // Try to get current user info
    getCurrentUser();
    
  } catch (error) {
    console.error('❌ Pi SDK initialization failed:', error);
    updateDebugInfo('debugSdkStatus', 'Failed: ' + error.message);
    showStatus('Pi SDK initialization failed. Please ensure you are using Pi Browser.', 'error');
  }
});

// Get current Pi user info
async function getCurrentUser() {
  try {
    const auth = await Pi.authenticate(['username', 'payments'], { onIncompletePaymentFound: onIncompletePaymentFound });
    piUser = auth.user;
    
    console.log('👤 Pi user authenticated:', piUser);
    updateDebugInfo('debugUser', piUser.username);
    
    showStatus(`Welcome ${piUser.username}! Ready to process payment.`, 'info');
    
  } catch (error) {
    console.log('🔐 User not authenticated, will authenticate during payment');
    updateDebugInfo('debugUser', 'Not authenticated');
  }
}

// Handle incomplete payment callback
function onIncompletePaymentFound(payment) {
  console.log('🔄 Incomplete payment found:', payment);
  currentPaymentId = payment.identifier;
  updateDebugInfo('debugPaymentId', currentPaymentId);
  showStatus('Found incomplete payment. You can complete it or create a new one.', 'info');
}

// Pay button click handler
document.getElementById('payPiBtn').addEventListener('click', async function() {
  console.log('💳 Pay button clicked');
  
  const payBtn = this;
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';
  
  try {
    // Authenticate user if not already done
    if (!piUser) {
      console.log('🔐 Authenticating user...');
      const auth = await Pi.authenticate(['username', 'payments'], { onIncompletePaymentFound: onIncompletePaymentFound });
      piUser = auth.user;
      updateDebugInfo('debugUser', piUser.username);
    }
    
    // Create payment
    console.log('💰 Creating payment...');
    const paymentData = {
      amount: 1,
      memo: `Auction registration for ${piUser.username}`,
      metadata: {
        type: 'auction_registration',
        username: piUser.username,
        timestamp: new Date().toISOString()
      }
    };
    
    const payment = await Pi.createPayment(paymentData, {
      onReadyForServerApproval: function(paymentId) {
        console.log('✅ Payment ready for approval:', paymentId);
        currentPaymentId = paymentId;
        updateDebugInfo('debugPaymentId', paymentId);
        showStatus('Payment created! Approving immediately...', 'info');
        
        // Approve immediately to prevent timeout
        setTimeout(() => approvePaymentOnServer(paymentId), 100);
      },
      onReadyForServerCompletion: function(paymentId, txid) {
        console.log('✅ Payment ready for completion:', paymentId, txid);
        showStatus('Payment approved! Completing transaction...', 'info');
        
        // Complete immediately
        setTimeout(() => completePaymentOnServer(paymentId, txid), 100);
      },
      onCancel: function(paymentId) {
        console.log('❌ Payment cancelled:', paymentId);
        showStatus('Payment was cancelled.', 'error');
        resetPaymentButton();
      },
      onError: function(error, payment) {
        console.error('❌ Payment error:', error, payment);
        showStatus('Payment failed: ' + error.message, 'error');
        resetPaymentButton();
      }
    });
    
    console.log('💳 Payment created:', payment);
    
  } catch (error) {
    console.error('❌ Payment creation failed:', error);
    showStatus('Payment failed: ' + error.message, 'error');
    resetPaymentButton();
  }
});

// Approve payment on server
async function approvePaymentOnServer(paymentId) {
  try {
    const response = await fetch('/approve-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId })
    });
    
    const result = await response.json();
    console.log('🔧 Server approval response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Server approval failed');
    }
    
    showStatus('Payment approved by server!', 'success');
    
  } catch (error) {
    console.error('❌ Server approval failed:', error);
    showStatus('Server approval failed: ' + error.message, 'error');
    resetPaymentButton();
  }
}

// Complete payment on server
async function completePaymentOnServer(paymentId, txid) {
  try {
    const response = await fetch('/complete-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, txid })
    });
    
    const result = await response.json();
    console.log('✅ Server completion response:', result);
    
    if (result.success) {
      showStatus('🎉 Payment completed successfully! Welcome to the auction!', 'success');
      
      // Redirect to auction after successful payment
      setTimeout(() => {
        window.location.href = '/auction.html';
      }, 3000);
      
    } else {
      throw new Error(result.message || 'Server completion failed');
    }
    
  } catch (error) {
    console.error('❌ Server completion failed:', error);
    showStatus('Payment completion failed: ' + error.message, 'error');
    resetPaymentButton();
  }
}

// Reset payment button to original state
function resetPaymentButton() {
  const payBtn = document.getElementById('payPiBtn');
  payBtn.disabled = false;
  payBtn.textContent = 'Pay 1 Pi Coin to Register';
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('paymentStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';
  
  console.log(`📢 Status (${type}):`, message);
}

// Update debug info
function updateDebugInfo(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// Toggle debug info visibility
function toggleDebug() {
  const debugDiv = document.getElementById('debugInfo');
  debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
}
