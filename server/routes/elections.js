const express = require('express');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all elections (for admin)
router.get('/', auth, async (req, res) => {
  try {
    const { Election, Vote, User } = req.app.get('models');
    
    const elections = await Election.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['created_at', 'DESC']]
    });

    // Get vote counts for each election
    const electionsWithVotes = await Promise.all(
      elections.map(async (election) => {
        const voteCount = await Vote.count({ where: { electionId: election.id } });
        return {
          ...election.toJSON(),
          totalVotes: voteCount
        };
      })
    );

    res.json({
      success: true,
      elections: electionsWithVotes
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch elections'
    });
  }
});

// Get active elections (for voting)
router.get('/active', auth, async (req, res) => {
  try {
    const { Election, User } = req.app.get('models');
    
    const elections = await Election.findAll({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      elections
    });
  } catch (error) {
    console.error('Get active elections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active elections'
    });
  }
});

// Get election by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { Election, User } = req.app.get('models');
    
    const election = await Election.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    res.json({
      success: true,
      election
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch election'
    });
  }
});

// Create election (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    const { Election } = req.app.get('models');

    console.log('Create election request:', { title, description, startDate, endDate });
    console.log('User making request:', req.user);

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use ISO format.'
      });
    }

    // Validate end date is after start date
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate start date is not too far in the past (allow 1 day grace period)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (start < oneDayAgo) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be more than 1 day in the past'
      });
    }

    // Determine initial status based on dates
    let status = 'upcoming';
    if (start <= now && end > now) {
      status = 'active';
    } else if (end <= now) {
      status = 'closed';
    }

    const election = await Election.create({
      title,
      description: description || '',
      startDate,
      endDate,
      createdBy: req.user.id,
      status
    });

    console.log('Election created successfully:', election.id);

    res.status(201).json({
      success: true,
      message: status === 'active' ? 'Election created and is now active' : 'Election created successfully',
      election
    });
  } catch (error) {
    console.error('Create election error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create election'
    });
  }
});

// Update election status (admin only)
router.patch('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { Election } = req.app.get('models');

    if (!['upcoming', 'active', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const election = await Election.findByPk(req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    election.status = status;
    await election.save();

    res.json({
      success: true,
      message: 'Election status updated',
      election
    });
  } catch (error) {
    console.error('Update election status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update election status'
    });
  }
});

// Delete election (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { Election, Vote, Candidate, Coalition } = req.app.get('models');
    
    const election = await Election.findByPk(req.params.id);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Cascade delete related data
    await Vote.destroy({ where: { electionId: req.params.id } });
    await Candidate.destroy({ where: { electionId: req.params.id } });
    await Coalition.destroy({ where: { electionId: req.params.id } });
    
    await election.destroy();

    res.json({
      success: true,
      message: 'Election deleted successfully'
    });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete election'
    });
  }
});

module.exports = router;

