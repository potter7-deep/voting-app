require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const rateLimit = require('express-rate-limit');

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

// Import models as factory functions
const User = require('./models/User');
const Election = require('./models/Election');
const Coalition = require('./models/Coalition');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const electionRoutes = require('./routes/elections');
const coalitionRoutes = require('./routes/coalitions');
const candidateRoutes = require('./routes/candidates');
const voteRoutes = require('./routes/votes');
const resultsRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, you might want to set this to false
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // No origins configured - allow all (dev mode)
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - General API requests
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: isProduction // Enable trust proxy in production (for accurate IP detection behind load balancers)
});

// Rate limiting - Login attempts
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: isProduction
});

// Rate limiting - Vote casting (prevent vote manipulation)
const voteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 vote attempts per minute
  message: {
    success: false,
    message: 'Too many vote attempts. Please wait before voting again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: isProduction
});

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/coalitions', coalitionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Voting System API is running (SQLite)' });
});

// Serve static files in production
if (isProduction) {
  // Serve client build files
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// SQLite Database Setup
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'voting_system.sqlite');

// Determine if we should bind to all interfaces or localhost only
const HOST = isProduction ? '0.0.0.0' : 'localhost';

console.log('Initializing SQLite database at:', DB_PATH);
console.log('Environment:', isProduction ? 'production' : 'development');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false, // Set to console.log for debugging
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Initialize models
const UserModel = User(sequelize);
const ElectionModel = Election(sequelize);
const CoalitionModel = Coalition(sequelize);
const CandidateModel = Candidate(sequelize);
const VoteModel = Vote(sequelize);

// Define associations
UserModel.hasMany(ElectionModel, { foreignKey: 'created_by', as: 'elections' });
ElectionModel.belongsTo(UserModel, { foreignKey: 'created_by', as: 'creator' });

ElectionModel.hasMany(CoalitionModel, { foreignKey: 'election_id', as: 'coalitions' });
CoalitionModel.belongsTo(ElectionModel, { foreignKey: 'election_id', as: 'election' });

ElectionModel.hasMany(CandidateModel, { foreignKey: 'election_id', as: 'candidates' });
CandidateModel.belongsTo(ElectionModel, { foreignKey: 'election_id', as: 'election' });

CoalitionModel.hasMany(CandidateModel, { foreignKey: 'coalition_id', as: 'candidates' });
CandidateModel.belongsTo(CoalitionModel, { foreignKey: 'coalition_id', as: 'coalition' });

ElectionModel.hasMany(VoteModel, { foreignKey: 'election_id', as: 'votes' });
VoteModel.belongsTo(ElectionModel, { foreignKey: 'election_id', as: 'election' });

CoalitionModel.hasMany(VoteModel, { foreignKey: 'coalition_id', as: 'votes' });
VoteModel.belongsTo(CoalitionModel, { foreignKey: 'coalition_id', as: 'coalition' });

UserModel.hasMany(VoteModel, { foreignKey: 'voter_id', as: 'votes' });
VoteModel.belongsTo(UserModel, { foreignKey: 'voter_id', as: 'voter' });

// Make models available to routes
app.set('sequelize', sequelize);
app.set('models', {
  User: UserModel,
  Election: ElectionModel,
  Coalition: CoalitionModel,
  Candidate: CandidateModel,
  Vote: VoteModel
});

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await UserModel.findOne({ where: { role: 'admin' } });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Default admin password for production deployment
    const adminPassword = 'admin';

    // Create default admin user
    await UserModel.create({
      name: 'Admin User',
      email: 'admin@university.edu',
      password: adminPassword,
      registrationNumber: 'ADMIN001',
      year: 1,
      role: 'admin'
    });

    console.log('✓ Default admin user created successfully!');
    console.log('  Email: admin@university.edu');
    console.log('  Password: admin');
    console.log('  IMPORTANT: Please change this password after first login!');
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
};

// Function to automatically update election statuses based on dates
const syncElectionStatuses = async () => {
  try {
    const now = new Date();
    
    // Close elections that have ended
    await ElectionModel.update(
      { status: 'closed' },
      {
        where: {
          status: 'active',
          endDate: {
            [require('sequelize').Op.lt]: now
          }
        }
      }
    );
    
    // Activate elections that have started
    await ElectionModel.update(
      { status: 'active' },
      {
        where: {
          status: 'upcoming',
          startDate: {
            [require('sequelize').Op.lte]: now
          },
          endDate: {
            [require('sequelize').Op.gt]: now
          }
        }
      }
    );
    
    // Log if any elections were updated (for debugging)
    const activeCount = await ElectionModel.count({ where: { status: 'active' } });
    const upcomingCount = await ElectionModel.count({ where: { status: 'upcoming' } });
    const closedCount = await ElectionModel.count({ where: { status: 'closed' } });
    
    console.log(`Election Status Sync: Active: ${activeCount}, Upcoming: ${upcomingCount}, Closed: ${closedCount}`);
  } catch (error) {
    console.error('Error syncing election statuses:', error.message);
  }
};

// Schedule election status sync every 5 minutes
const startElectionStatusScheduler = () => {
  // Run immediately on startup
  syncElectionStatuses();
  
  // Then run every 5 minutes
  setInterval(syncElectionStatuses, 5 * 60 * 1000);
  
  console.log('✓ Election status scheduler started (runs every 5 minutes)');
};

// Connect to SQLite and start server
sequelize.sync({ force: false })
  .then(async () => {
    console.log('✓ Database synchronized with SQLite');
    
    // Create default admin user after successful sync
    await createDefaultAdmin();
    
    // Start election status scheduler
    startElectionStatusScheduler();
    
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

module.exports = app;

