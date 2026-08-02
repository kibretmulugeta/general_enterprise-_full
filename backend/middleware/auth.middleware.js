const { verifyAccessToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const roleRepository = require('../repositories/role.repository');

/**
 * Protect routes - Verifies JWT Access Token from Cookie or Bearer Header
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check Cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    // Check Authorization Header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No token provided.' }
      });
    }

    // Verify JWT Token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired access token.', code: 'TOKEN_EXPIRED' }
      });
    }

    // Check if session is valid in DB
    if (decoded.sessionId) {
      const session = await sessionRepository.findSessionByTokenHash; // Check session status
      // We can also double-check Session record validity
      const sessionDoc = await sessionRepository.findActiveSessionsByUserId(decoded.id);
      const currentSession = sessionDoc.find(s => s._id.toString() === decoded.sessionId && s.isValid);
      if (!currentSession) {
        return res.status(401).json({
          success: false,
          error: { message: 'Session has been revoked or invalidated.' }
        });
      }
    }

    // Fetch User from DB
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User account no longer exists.' }
      });
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: { message: `Account is currently ${user.status}. Access denied.` }
      });
    }

    // Attach User and Session to Request
    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Authentication error', details: error.message }
    });
  }
};

module.exports = { protect };
