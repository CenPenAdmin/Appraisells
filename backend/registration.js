// registration.js - User registration handlers
const { UserRegistration, PiPayment } = require('./database');

// Profile registration (no payment required)
const registerProfile = async (req, res) => {
  try {
    const profileData = req.body;
    
    console.log(`🔄 Processing profile registration for: ${profileData.personalInfo?.email}`);
    
    if (!profileData.personalInfo) {
      return res.status(400).json({
        success: false,
        message: "Missing required personal information"
      });
    }

    // Check if user already has a profile
    const existingUser = await UserRegistration.findOne({
      'personalInfo.email': profileData.personalInfo.email
    });

    if (existingUser) {
      // Update existing profile
      const updatedUser = await UserRegistration.findOneAndUpdate(
        { 'personalInfo.email': profileData.personalInfo.email },
        {
          ...profileData,
          registrationStatus: 'profile_completed',
          updatedAt: new Date()
        },
        { new: true }
      );

      console.log(`✅ Profile updated: ${profileData.personalInfo.email}`);
      
      return res.json({
        success: true,
        message: "Profile updated successfully",
        registrationId: updatedUser._id,
        email: profileData.personalInfo.email,
        status: 'updated'
      });
    } else {
      // Create new profile (without payment)
      const newProfile = new UserRegistration({
        personalInfo: {
          fullName: profileData.personalInfo.fullName,
          email: profileData.personalInfo.email,
          phone: profileData.personalInfo.phone || ''  // Default to empty string if not provided
        },
        shippingAddress: profileData.shippingAddress,
        agreements: profileData.agreements,
        registrationStatus: 'profile_completed',
        payment: {
          paymentId: 'pending',
          amount: 1,
          completed: false
        }
      });

      await newProfile.save();

      console.log(`✅ Profile created: ${profileData.personalInfo.email}`);
      
      res.json({
        success: true,
        message: "Profile registration completed successfully",
        registrationId: newProfile._id,
        email: profileData.personalInfo.email,
        status: 'created'
      });
    }

  } catch (error) {
    console.error("❌ Profile registration error:", error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Profile registration failed",
        error: error.message
      });
    }
  }
};

// Full registration with payment validation
const registerUser = async (req, res) => {
  try {
    const registrationData = req.body;
    
    console.log(`🔄 Processing user registration for: ${registrationData.personalInfo?.email}`);
    
    if (!registrationData.personalInfo || !registrationData.payment?.paymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required registration data"
      });
    }

    // Check if payment was completed
    const piPayment = await PiPayment.findOne({ 
      paymentId: registrationData.payment.paymentId,
      status: 'completed'
    });

    if (!piPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not completed. Please complete payment first."
      });
    }

    // Check if user already registered
    const existingUser = await UserRegistration.findOne({
      'personalInfo.email': registrationData.personalInfo.email
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create new user registration
    const newRegistration = new UserRegistration({
      ...registrationData,
      registrationStatus: 'completed',
      'payment.completed': true,
      'payment.completedAt': new Date()
    });

    await newRegistration.save();

    console.log(`✅ User registered successfully: ${registrationData.personalInfo.email}`);
    
    res.json({
      success: true,
      message: "Registration completed successfully",
      registrationId: newRegistration._id,
      email: registrationData.personalInfo.email
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message
      });
    }
  }
};

// Get registration status
const getRegistrationStatus = async (req, res) => {
  try {
    const { email } = req.params;
    
    const registration = await UserRegistration.findOne({
      'personalInfo.email': email
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    res.json({
      success: true,
      registration: {
        email: registration.personalInfo.email,
        name: registration.personalInfo.fullName,
        status: registration.registrationStatus,
        paymentCompleted: registration.payment.completed,
        registeredAt: registration.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check registration status"
    });
  }
};

module.exports = {
  registerProfile,
  registerUser,
  getRegistrationStatus
};
