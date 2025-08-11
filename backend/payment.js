// payment.js - Pi payment handlers
const { PiPayment, UserRegistration } = require('./database');
const config = require('./config');
const axios = require('axios');

// Pi Network API helper function
async function validatePaymentWithPiAPI(paymentId) {
  try {
    if (!config.PI_API_KEY) {
      console.log('⚠️  PI_API_KEY not set, skipping Pi API validation');
      return { valid: true, message: 'API key not configured - sandbox mode' };
    }

    const response = await axios.get(`${config.PI_API_URL}/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Key ${config.PI_API_KEY}`
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('🔍 Pi API validation response:', response.data);
    return { valid: true, data: response.data };

  } catch (error) {
    console.error('❌ Pi API validation failed:', error.message);
    
    // In sandbox/development, allow payments even if API fails
    if (config.PI_SANDBOX) {
      console.log('🏖️  Sandbox mode: Allowing payment despite API validation failure');
      return { valid: true, message: 'Sandbox mode - API validation bypassed' };
    }
    
    return { valid: false, error: error.message };
  }
}

// Approve payment with Pi API validation
async function approvePiPayment(paymentId) {
  try {
    if (!config.PI_API_KEY) {
      console.log('⚠️  PI_API_KEY not set, skipping Pi API approval');
      return { success: true, message: 'API key not configured - sandbox mode' };
    }

    const response = await axios.post(`${config.PI_API_URL}/v2/payments/${paymentId}/approve`, {}, {
      headers: {
        'Authorization': `Key ${config.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('✅ Pi API approval response:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    console.error('❌ Pi API approval failed:', error.message);
    
    // In sandbox/development, allow payments even if API fails
    if (config.PI_SANDBOX) {
      console.log('🏖️  Sandbox mode: Allowing approval despite API failure');
      return { success: true, message: 'Sandbox mode - API approval bypassed' };
    }
    
    return { success: false, error: error.message };
  }
}

// Complete payment with Pi API
async function completePiPayment(paymentId, txid) {
  try {
    if (!config.PI_API_KEY) {
      console.log('⚠️  PI_API_KEY not set, skipping Pi API completion');
      return { success: true, message: 'API key not configured - sandbox mode' };
    }

    const response = await axios.post(`${config.PI_API_URL}/v2/payments/${paymentId}/complete`, {
      txid: txid
    }, {
      headers: {
        'Authorization': `Key ${config.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('✅ Pi API completion response:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    console.error('❌ Pi API completion failed:', error.message);
    
    // In sandbox/development, allow payments even if API fails
    if (config.PI_SANDBOX) {
      console.log('🏖️  Sandbox mode: Allowing completion despite API failure');
      return { success: true, message: 'Sandbox mode - API completion bypassed' };
    }
    
    return { success: false, error: error.message };
  }
}

// Approve payment endpoint
const approvePayment = async (req, res) => {
  try {
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment approval for: ${paymentId}`);
    console.log(`⚡ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔧 Pi API Key configured: ${config.PI_API_KEY ? 'Yes' : 'No'}`);
    console.log(`🏖️  Sandbox mode: ${config.PI_SANDBOX}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Validate and approve with Pi API first
    const piApiResult = await approvePiPayment(paymentId);
    
    if (!piApiResult.success && !config.PI_SANDBOX) {
      return res.status(400).json({
        success: false,
        message: "Pi Network API approval failed: " + piApiResult.error
      });
    }

    // Send immediate response to prevent timeout
    res.json({
      success: true,
      message: "Payment approved successfully",
      paymentId,
      timestamp: new Date().toISOString(),
      piApiStatus: piApiResult.message || 'Approved via Pi API'
    });

    // Process database operations asynchronously after response
    setImmediate(async () => {
      try {
        // Store payment in database with approved status
        await PiPayment.findOneAndUpdate(
          { paymentId },
          {
            status: 'approved',
            userEmail,
            'timestamps.approved': new Date(),
            piApiResponse: piApiResult.data || piApiResult.message
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true 
          }
        );

        // Update user registration if exists
        if (userEmail) {
          await UserRegistration.findOneAndUpdate(
            { 'personalInfo.email': userEmail },
            { 
              'payment.approvedAt': new Date(),
              registrationStatus: 'payment_approved',
              updatedAt: new Date()
            }
          );
        }

        console.log(`✅ Payment approved in database: ${paymentId}`);
      } catch (dbError) {
        console.error(`❌ Database update failed for payment ${paymentId}:`, dbError);
      }
    });

  } catch (error) {
    console.error("❌ Payment approval error:", error);
    res.status(500).json({
      success: false,
      message: "Payment approval failed",
      error: error.message
    });
  }
};

// Complete payment endpoint
const completePayment = async (req, res) => {
  try {
    const { paymentId, userEmail, txid } = req.body;
    
    console.log(`🔄 Processing payment completion for: ${paymentId}`);
    console.log(`⚡ Timestamp: ${new Date().toISOString()}`);
    console.log(`🏷️  Transaction ID: ${txid}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Complete with Pi API first
    const piApiResult = await completePiPayment(paymentId, txid);
    
    if (!piApiResult.success && !config.PI_SANDBOX) {
      return res.status(400).json({
        success: false,
        message: "Pi Network API completion failed: " + piApiResult.error
      });
    }

    // Send immediate response to prevent timeout
    res.json({
      success: true,
      message: "Payment completed successfully",
      paymentId,
      status: 'completed',
      timestamp: new Date().toISOString(),
      piApiStatus: piApiResult.message || 'Completed via Pi API'
    });

    // Process database operations asynchronously after response
    setImmediate(async () => {
      try {
        // Update payment status to completed
        await PiPayment.findOneAndUpdate(
          { paymentId },
          {
            status: 'completed',
            'timestamps.completed': new Date(),
            txid: txid,
            piApiResponse: piApiResult.data || piApiResult.message
          },
          { 
            upsert: true,
            new: true,
            setDefaultsOnInsert: true 
          }
        );

        // Update user registration
        if (userEmail) {
          await UserRegistration.findOneAndUpdate(
            { 'personalInfo.email': userEmail },
            { 
              'payment.completed': true,
              'payment.completedAt': new Date(),
              registrationStatus: 'completed',
              updatedAt: new Date()
            }
          );
        }

        console.log(`✅ Payment completed in database: ${paymentId}`);
      } catch (dbError) {
        console.error(`❌ Database update failed for completion ${paymentId}:`, dbError);
      }
    });

  } catch (error) {
    console.error("❌ Payment completion error:", error);
    res.status(500).json({
      success: false,
      message: "Payment completion failed",
      error: error.message
    });
  }
};

module.exports = {
  approvePayment,
  completePayment
};
