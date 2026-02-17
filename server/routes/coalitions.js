const express = require('express');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get coalitions by election
router.get('/election/:electionId', auth, async (req, res) => {
  try {
    const { Coalition } = req.app.get('models');
    
    const coalitions = await Coalition.findAll({
      where: { electionId: req.params.electionId },
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      coalitions
    });
  } catch (error) {
    console.error('Get coalitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coalitions'
    });
  }
});

// Get single coalition
router.get('/:id', auth, async (req, res) => {
  try {
    const { Coalition } = req.app.get('models');
    
    const coalition = await Coalition.findByPk(req.params.id);

    if (!coalition) {
      return res.status(404).json({
        success: false,
        message: 'Coalition not found'
      });
    }

    res.json({
      success: true,
      coalition
    });
  } catch (error) {
    console.error('Get coalition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coalition'
    });
  }
});

// Create coalition (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { electionId, name, symbol, color } = req.body;
    const { Coalition, Election } = req.app.get('models');

    if (!electionId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Election ID and name are required'
      });
    }

    // Check if election exists
    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Check for duplicate coalition name in this election
    const existing = await Coalition.findOne({
      where: {
        electionId,
        name
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A coalition with this name already exists in this election'
      });
    }

    const coalition = await Coalition.create({
      electionId,
      name,
      symbol: symbol || null,
      color: color || '#10b981'
    });

    res.status(201).json({
      success: true,
      message: 'Coalition created successfully',
      coalition
    });
  } catch (error) {
    console.error('Create coalition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coalition'
    });
  }
});

// Delete coalition (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { Coalition, Candidate } = req.app.get('models');
    
    const coalition = await Coalition.findByPk(req.params.id);

    if (!coalition) {
      return res.status(404).json({
        success: false,
        message: 'Coalition not found'
      });
    }

    // Remove coalition reference from candidates (but don't delete candidates)
    await Candidate.update(
      { coalitionId: null },
      { where: { coalitionId: req.params.id } }
    );

    await coalition.destroy();

    res.json({
      success: true,
      message: 'Coalition deleted successfully'
    });
  } catch (error) {
    console.error('Delete coalition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coalition'
    });
  }
});

module.exports = router;

