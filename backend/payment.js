// payment.js - Pi payment handlers
const { PiPayment, UserRegistration } = require('./database');

// Approve payment endpoint
const approvePayment = async (req, res) => {
  try {
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment approval for: ${paymentId}`);
    console.log(`⚡ Timestamp: ${new Date().toISOString()}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Send immediate response to prevent timeout
    res.json({
      success: true,
      message: "Payment approved successfully",
      paymentId,
      timestamp: new Date().toISOString()
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
            'timestamps.approved': new Date()
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
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Send immediate response to prevent timeout
    res.json({
      success: true,
      message: "Payment completed successfully",
      paymentId,
      status: 'completed',
      timestamp: new Date().toISOString()
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
            txid: txid
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
