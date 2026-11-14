import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/index.js';

/**
 * Socket.IO Authentication Middleware.
 * Validates JWT access token in socket handshake auth or headers.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers?.authorization;
    let token = socket.handshake.auth?.token;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new Error('Authentication error: Token missing from handshake'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User account inactive or deleted'));
    }

    socket.user = user;
    return next();
  } catch (err) {
    return next(new Error(`Authentication error: ${err.message}`));
  }
};

export default socketAuthMiddleware;
