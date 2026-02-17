const express = require('express');
const { auth, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const { User, Vote, Election } = req.app.get('models');
    
    const totalUsers = await User.count({ where: { role: 'voter' } });
    const totalElections = await Election.count();
    const totalVotes = await Vote.count();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalElections,
        totalVotes
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Change password (authenticated user)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { User } = req.app.get('models');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get the current user from database
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;

