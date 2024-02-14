// utils/authMiddleware.js

const jwt = require('jsonwebtoken');
const { forbiddenRes, unauthorizedRes } = require('./response');
require('dotenv').config();

const extractTokenFromHeader = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [bearer, token] = authorizationHeader.split(' ');

  // Check if the Authorization header has the correct format and starts with "Bearer"
  if (bearer && bearer.toLowerCase() === 'bearer' && token) {
    return token;
  }

  return null;
};


function authenticateToken(req, res, next) {

  const authorizationHeader =  req.header('Authorization');
  const token = extractTokenFromHeader(authorizationHeader);
  
  if (!token) return unauthorizedRes(res);

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return forbiddenRes(res);
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
