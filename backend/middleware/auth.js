const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  return 'local_dev_secret';
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader ? authHeader.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      status: 'failed',
      message: 'Authentication token is missing.',
    });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'failed',
        message: 'Authentication token is invalid or expired.',
      });
    }

    req.user = user;
    return next();
  });
};

module.exports = { authenticateToken, getJwtSecret };
