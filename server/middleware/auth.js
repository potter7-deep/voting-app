const jwt = require('jsonwebtoken');

// Validate JWT_SECRET - throw error if not properly configured
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Please set JWT_SECRET in your .env file.');
}

if (JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long for security. Please update your .env file.');
}

// List of known weak secrets that should not be used
const KNOWN_WEAK_SECRETS = [
  'your-secret-key-change-in-production',
  'secret',
  'password',
  '123456',
  'default-secret',
  'changeme'
];

if (KNOWN_WEAK_SECRETS.includes(JWT_SECRET.toLowerCase())) {
  throw new Error('CRITICAL: JWT_SECRET is using a known weak value. Please update your .env file with a strong, unique secret.');
}

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get User model from app settings
    const User = req.app.get('models').User;
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Attach user to request (without password)
    req.user = user.toJSON();
    req.user.id = user.id;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid authentication token' 
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking admin status' 
    });
  }
};

module.exports = { auth, isAdmin, JWT_SECRET };

