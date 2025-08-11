// register.js - Registration form functionality
let profileCompleted = false;

// Check if all required fields and agreements are completed
function validateForm() {
  const requiredFields = ['fullName', 'email', 'address1', 'city', 'state', 'zipCode', 'country'];
  const requiredCheckboxes = ['agreeShipping', 'agreeTerms', 'agreePrivacy'];
  
  // Check required fields
  const fieldsValid = requiredFields.every(fieldId => {
    const field = document.getElementById(fieldId);
    return field && field.value.trim() !== '';
  });
  
  // Check required checkboxes
  const checkboxesValid = requiredCheckboxes.every(checkboxId => {
    const checkbox = document.getElementById(checkboxId);
    return checkbox && checkbox.checked;
  });
  
  // Enable submit button only if all requirements are met
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = !(fieldsValid && checkboxesValid);
  
  return fieldsValid && checkboxesValid;
}

// Add event listeners to all form elements
document.addEventListener('DOMContentLoaded', function() {
  const formElements = document.querySelectorAll('input, select, textarea');
  formElements.forEach(element => {
    element.addEventListener('input', validateForm);
    element.addEventListener('change', validateForm);
  });
});

// Form submission handler
document.getElementById('registrationForm').onsubmit = function(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    showStatus('Please complete all required fields and agreements', 'error');
    return;
  }
  
  // Collect form data directly from form elements
  const form = e.target;
  const registrationData = {
    personalInfo: {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim()
    },
    shippingAddress: {
      address1: form.address1.value.trim(),
      address2: form.address2.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      zipCode: form.zipCode.value.trim(),
      country: form.country.value
    },
    agreements: {
      shipping: form.agreeShipping.checked,
      terms: form.agreeTerms.checked,
      privacy: form.agreePrivacy.checked
    },
    registrationStatus: 'profile_completed',
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Sending registration data:', registrationData);
  
  // Validate data before sending
  console.log('🔍 Validation checks:');
  console.log('- Full Name:', registrationData.personalInfo.fullName);
  console.log('- Email:', registrationData.personalInfo.email);
  console.log('- Address:', registrationData.shippingAddress.address1);
  console.log('- Country:', registrationData.shippingAddress.country);
  console.log('- Agreements:', registrationData.agreements);
  
  // Send registration data to server
  console.log('🌐 Attempting to connect to /register-profile...');
  
  fetch('/register-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  })
  .then(res => {
    console.log('📡 Server response received!');
    console.log('📡 Response status:', res.status);
    console.log('📡 Response ok:', res.ok);
    console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    return res.json();
  })
  .then(data => {
    console.log('📡 Server response data:', data);
    if (data.success) {
      showStatus('✅ Profile completed successfully! Redirecting to payment...', 'success');
      
      console.log('✅ Profile registration successful:', data);
      
      // Redirect to payment page after 2 seconds
      setTimeout(() => {
        window.location.href = `/payment.html?email=${encodeURIComponent(registrationData.personalInfo.email)}`;
      }, 2000);
    } else {
      showStatus('❌ Registration failed: ' + data.message, 'error');
      console.error('❌ Registration failed:', data);
    }
  })
  .catch(error => {
    console.error('❌ Network/Registration error details:');
    console.error('- Error type:', error.constructor.name);
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    console.error('- Full error object:', error);
    
    let errorMessage = 'Registration failed: ';
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Cannot connect to server. Please check your connection.';
    } else if (error.message.includes('HTTP')) {
      errorMessage += 'Server error: ' + error.message;
    } else {
      errorMessage += error.message || 'Please try again';
    }
    
    showStatus('❌ ' + errorMessage, 'error');
  });
};

function showStatus(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}
