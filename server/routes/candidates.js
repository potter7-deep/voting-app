const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/candidates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'candidate-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get candidates by election with coalition details
router.get('/election/:electionId', auth, async (req, res) => {
  try {
    const { Candidate, Coalition } = req.app.get('models');
    
    // Get all coalitions for this election
    const coalitions = await Coalition.findAll({
      where: { electionId: req.params.electionId }
    });
    
    // Get candidates for each coalition
    const coalitionsWithMembers = await Promise.all(
      coalitions.map(async (coalition) => {
        const members = await Candidate.findAll({
          where: { coalitionId: coalition.id },
          order: [['position', 'ASC']]
        });
        return {
          id: coalition.id,
          _id: coalition.id,
          name: coalition.name,
          symbol: coalition.symbol,
          color: coalition.color,
          members: members.map(m => ({
            id: m.id,
            _id: m.id,
            name: m.name,
            position: m.position,
            bio: m.bio,
            imageUrl: m.imageUrl
          }))
        };
      })
    );

    res.json({
      success: true,
      coalitions: coalitionsWithMembers
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates'
    });
  }
});

// Get single candidate
router.get('/:id', auth, async (req, res) => {
  try {
    const { Candidate, Coalition } = req.app.get('models');
    
    const candidate = await Candidate.findByPk(req.params.id, {
      include: [{
        model: Coalition,
        as: 'coalition',
        attributes: ['id', 'name', 'color']
      }]
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      candidate
    });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate'
    });
  }
});

// Create candidate with image upload (admin only)
router.post('/', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { coalitionId, electionId, name, position, bio } = req.body;
    const { Candidate, Election } = req.app.get('models');

    if (!electionId || !name || !position) {
      return res.status(400).json({
        success: false,
        message: 'Election ID, name, and position are required'
      });
    }

    const validPositions = ['chairperson', 'vice_chair', 'secretary', 'sports_person', 'treasurer', 'gender_representative'];
    if (!validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position'
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

    const candidateData = {
      electionId: parseInt(electionId),
      name,
      position,
      bio: bio || ''
    };

    if (coalitionId) {
      candidateData.coalitionId = parseInt(coalitionId);
    }

    if (req.file) {
      candidateData.imageUrl = '/uploads/candidates/' + req.file.filename;
    }

    const candidate = await Candidate.create(candidateData);

    res.status(201).json({
      success: true,
      message: 'Candidate added successfully',
      candidate
    });
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create candidate'
    });
  }
});

// Update candidate image (admin only)
router.patch('/:id/image', auth, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { Candidate } = req.app.get('models');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    const candidate = await Candidate.findByPk(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Delete old image if exists
    if (candidate.imageUrl) {
      const oldImagePath = path.join(__dirname, '..', candidate.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    candidate.imageUrl = '/uploads/candidates/' + req.file.filename;
    await candidate.save();

    res.json({
      success: true,
      message: 'Image updated successfully',
      candidate
    });
  } catch (error) {
    console.error('Update candidate image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update candidate image'
    });
  }
});

// Delete candidate (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { Candidate } = req.app.get('models');
    
    const candidate = await Candidate.findByPk(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Delete image if exists
    if (candidate.imageUrl) {
      const imagePath = path.join(__dirname, '..', candidate.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await candidate.destroy();

    res.json({
      success: true,
      message: 'Candidate removed successfully'
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete candidate'
    });
  }
});

module.exports = router;

