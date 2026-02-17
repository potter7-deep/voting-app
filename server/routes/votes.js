const express = require('express');
const rateLimit = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Additional rate limiting for vote casting
const voteRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 vote attempts per minute
  message: {
    success: false,
    message: 'Too many vote attempts. Please wait before voting again.'
  }
});

// Cast a vote
router.post('/', auth, voteRateLimiter, async (req, res) => {
  try {
    const { electionId, coalitionId } = req.body;
    const { Vote, Election } = req.app.get('models');

    if (!electionId || !coalitionId) {
      return res.status(400).json({
        success: false,
        message: 'Election ID and coalition ID are required'
      });
    }

    // Check if election exists and is active
    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    if (election.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This election is not currently active'
      });
    }

    // Check if election has ended
    const now = new Date();
    if (now > new Date(election.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'This election has ended'
      });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      where: {
        electionId,
        voterId: req.user.id
      }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this election'
      });
    }

    // Create vote
    const vote = await Vote.create({
      electionId,
      coalitionId,
      voterId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
});

// Check if user has voted in an election
router.get('/check/:electionId', auth, async (req, res) => {
  try {
    const { Vote } = req.app.get('models');
    
    const vote = await Vote.findOne({
      where: {
        electionId: req.params.electionId,
        voterId: req.user.id
      }
    });

    res.json({
      success: true,
      hasVoted: !!vote
    });
  } catch (error) {
    console.error('Check vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vote status'
    });
  }
});

module.exports = router;

