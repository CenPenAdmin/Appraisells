// payment.js - Pi payment functionality
console.log('🔧 Initializing Pi SDK...');
Pi.init({ version: "2.0", sandbox: true });

let userEmail = null;
let paymentId = null;
let paymentCompleted = false;

// Get user email from URL parameters
function getUserEmail() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  if (email) {
    userEmail = email;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('debugEmail').textContent = email;
    console.log('📧 User email:', email);
  } else {
    console.error('❌ No email parameter found');
    showStatus('Error: No user email found. Please return to registration.', 'error');
  }
  return email;
}

// Debug functions
function toggleDebug() {
  const debugDiv = document.getElementById('debugInfo');
  debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
}

function updateDebugStatus(status) {
  document.getElementById('debugSdkStatus').textContent = status;
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('paymentStatus');
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  console.log(`📱 Status (${type}):`, message);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  getUserEmail();
  updateDebugStatus('Ready');
});

// Pi Payment Handler
document.getElementById('payPiBtn').onclick = function() {
  console.log('💰 Payment button clicked');
  
  if (!userEmail) {
    showStatus('Error: User email not found', 'error');
    return;
  }

  showStatus('Initiating payment...', 'pending');
  updateDebugStatus('Creating payment...');
  
  try {
    Pi.createPayment({
      amount: 1,
      memo: "Appraisells Auction Registration Fee",
      metadata: { 
        purpose: "registration",
        userEmail: userEmail,
        timestamp: new Date().toISOString()
      }
    }, {
      onReadyForServerApproval: function(payment) {
        console.log('🔄 Payment ready for server approval:', payment);
        paymentId = payment.identifier;
        document.getElementById('debugPaymentId').textContent = paymentId;
        
        showStatus('Payment pending approval...', 'pending');
        updateDebugStatus('Waiting for server approval...');
        
        // Call server to approve the payment
        fetch('/approve-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.identifier,
            userEmail: userEmail
          })
        })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Server approval response:', data);
          if (data.success) {
            updateDebugStatus('Server approved payment');
            showStatus('Payment approved by server...', 'pending');
          } else {
            console.error('❌ Server approval failed:', data.message);
            showStatus('Server approval failed: ' + data.message, 'error');
          }
        })
        .catch(error => {
          console.error('❌ Server approval error:', error);
          showStatus('Server approval error', 'error');
          updateDebugStatus('Server approval failed');
        });
      },
      
      onReadyForServerCompletion: function(payment) {
        console.log('✅ Payment ready for completion:', payment);
        showStatus('Payment completed! Verifying...', 'success');
        updateDebugStatus('Completing payment...');
        
        // Update button
        const payBtn = document.getElementById('payPiBtn');
        payBtn.textContent = '✓ Payment Completed';
        payBtn.disabled = true;
        
        paymentCompleted = true;
        
        // Call server to complete the payment
        fetch('/complete-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: payment.identifier,
            userEmail: userEmail
          })
        })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Payment completion response:', data);
          if (data.success) {
            showStatus('✅ Registration payment verified! Redirecting...', 'success');
            updateDebugStatus('Payment completed successfully');
            
            // Update user registration status
            setTimeout(() => {
              window.location.href = '/profile.html?email=' + encodeURIComponent(userEmail);
            }, 3000);
          } else {
            console.error('❌ Server completion failed:', data.message);
            showStatus('Payment verification failed: ' + data.message, 'error');
            updateDebugStatus('Payment completion failed');
          }
        })
        .catch(error => {
          console.error('❌ Server completion error:', error);
          showStatus('Payment verification failed', 'error');
          updateDebugStatus('Server completion error');
        });
      },
      
      onCancel: function(payment) {
        console.log('❌ Payment cancelled:', payment);
        showStatus('Payment cancelled', 'error');
        updateDebugStatus('Payment cancelled by user');
        paymentCompleted = false;
      },
      
      onError: function(error, payment) {
        console.error('❌ Payment error:', error, payment);
        showStatus('Payment error: ' + error.message, 'error');
        updateDebugStatus('Payment error: ' + error.message);
        paymentCompleted = false;
      }
    });
    
  } catch (error) {
    console.error('❌ Payment creation error:', error);
    showStatus('Failed to create payment: ' + error.message, 'error');
    updateDebugStatus('Payment creation failed');
  }
};
