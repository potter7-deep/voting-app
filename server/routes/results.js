const express = require('express');
const { auth } = require('../middleware/auth');
const { Sequelize } = require('sequelize');
const { Op } = require('sequelize');

const router = express.Router();

// Get election results
router.get('/:electionId', auth, async (req, res) => {
  try {
    const { Election, Vote, Coalition } = req.app.get('models');
    
    const election = await Election.findByPk(req.params.electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Get all votes for this election grouped by coalition using raw SQL
    const results = await Vote.findAll({
      where: { electionId: req.params.electionId },
      attributes: [
        'coalition_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'voteCount']
      ],
      group: ['coalition_id'],
      raw: true,
      order: [[Sequelize.literal('voteCount'), 'DESC']]
    });

    // Get coalition details
    const coalitions = await Coalition.findAll({
      where: { electionId: req.params.electionId }
    });

    // Map results with coalition details
    const resultsWithDetails = results.map(result => {
      const coalition = coalitions.find(c => c.id === result.coalition_id);
      return {
        id: result.coalition_id,
        name: coalition ? coalition.name : 'Unknown',
        color: coalition ? coalition.color : '#10b981',
        voteCount: parseInt(result.voteCount)
      };
    });

    // Get total votes
    const totalVotes = await Vote.count({ where: { electionId: req.params.electionId } });

    res.json({
      success: true,
      results: resultsWithDetails,
      totalVotes,
      election: {
        id: election.id,
        _id: election.id,
        title: election.title,
        description: election.description,
        status: election.status,
        startDate: election.startDate,
        endDate: election.endDate
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results'
    });
  }
});

// Get all elections with results (for results page)
router.get('/', auth, async (req, res) => {
  try {
    const { Election, Vote } = req.app.get('models');
    
    const elections = await Election.findAll({
      where: {
        status: {
          [Op.in]: ['active', 'closed']
        }
      },
      order: [['created_at', 'DESC']]
    });

    const electionsWithResults = await Promise.all(
      elections.map(async (election) => {
        const totalVotes = await Vote.count({ where: { electionId: election.id } });
        return {
          id: election.id,
          _id: election.id,
          title: election.title,
          description: election.description,
          status: election.status,
          startDate: election.startDate,
          endDate: election.endDate,
          totalVotes
        };
      })
    );

    res.json({
      success: true,
      elections: electionsWithResults
    });
  } catch (error) {
    console.error('Get elections with results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch elections'
    });
  }
});

module.exports = router;

