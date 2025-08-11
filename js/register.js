// register.js - Registration form functionality
let profileCompleted = false;

// Check if all required fields and agreements are completed
function validateForm() {
  const requiredFields = ['fullName', 'email', 'phone', 'address1', 'city', 'state', 'zipCode', 'country'];
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
  
  // Collect form data
  const formData = new FormData(e.target);
  const registrationData = {
    personalInfo: {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone')
    },
    shippingAddress: {
      address1: formData.get('address1'),
      address2: formData.get('address2'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
      country: formData.get('country')
    },
    agreements: {
      shipping: formData.get('agreeShipping') === 'on',
      terms: formData.get('agreeTerms') === 'on',
      privacy: formData.get('agreePrivacy') === 'on'
    },
    registrationStatus: 'profile_completed',
    timestamp: new Date().toISOString()
  };
  
  // Send registration data to server
  fetch('/register-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  })
  .then(res => res.json())
  .then(data => {
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
    console.error('❌ Registration error:', error);
    showStatus('❌ Registration failed: Please try again', 'error');
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
