const express = require('express');

const router = express.Router();

// Get SETUP_TOKEN from environment - must be set for admin setup to work
const SETUP_TOKEN = process.env.SETUP_TOKEN;

// Setup first admin user (protected by SETUP_TOKEN)
// This endpoint should be disabled after first admin is created in production
router.post('/setup-admin', async (req, res) => {
  try {
    const { setupToken, name, email, password, registrationNumber } = req.body;
    const User = req.app.get('models').User;

    // SECURITY FIX: Require SETUP_TOKEN to be set in environment
    if (!SETUP_TOKEN) {
      console.error('SECURITY: SETUP_TOKEN is not configured. Admin setup is disabled.');
      return res.status(500).json({
        success: false,
        message: 'System configuration error. Please contact system administrator.'
      });
    }

    // Validate setup token
    if (setupToken !== SETUP_TOKEN) {
      // Use generic message to prevent token enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid setup credentials'
      });
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists. Please contact system administrator.'
      });
    }

    // Validate input
    if (!name || !email || !password || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already taken
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      registrationNumber,
      year: 1, // Default year for admin
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user'
    });
  }
});

// Check if admin exists
router.get('/check-admin', async (req, res) => {
  try {
    const User = req.app.get('models').User;
    
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    res.json({
      success: true,
      adminExists: !!adminExists
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check admin status'
    });
  }
});

module.exports = router;

