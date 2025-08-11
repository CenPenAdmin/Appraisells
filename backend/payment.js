// payment.js - Pi payment handlers
const { PiPayment, UserRegistration } = require('./database');

// Approve payment endpoint
const approvePayment = async (req, res) => {
  try {
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment approval for: ${paymentId}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Store payment in database with approved status
    const piPayment = await PiPayment.findOneAndUpdate(
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

    console.log(`✅ Payment approved: ${paymentId}`);
    
    res.json({
      success: true,
      message: "Payment approved successfully",
      paymentId,
      status: 'approved'
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
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment completion for: ${paymentId}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Update payment status to completed
    const piPayment = await PiPayment.findOneAndUpdate(
      { paymentId },
      {
        status: 'completed',
        'timestamps.completed': new Date()
      },
      { new: true }
    );

    if (!piPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

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

    console.log(`✅ Payment completed: ${paymentId}`);
    
    res.json({
      success: true,
      message: "Payment completed successfully",
      paymentId,
      status: 'completed'
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
