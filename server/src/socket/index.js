import { Server } from 'socket.io';
import { socketAuthMiddleware } from './socketAuth.js';
import { Membership } from '../models/index.js';
import { config } from '../config/env.js';

let ioInstance = null;

// Track online users: workspaceId -> Set of userIds
const workspacePresence = new Map();
// Track user socket connections: userId -> Set of socketIds
const userSockets = new Map();

/**
 * Initialize Socket.IO with CORS, authentication and real-time room dispatch.
 */
export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Attach Authentication Guard
  ioInstance.use(socketAuthMiddleware);

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal user notification room
    socket.join(`user:${userId}`);

    /**
     * Join Workspace Room
     * Validates active membership before allowing user to receive workspace broadcasts
     */
    socket.on('join:workspace', async (workspaceId, callback) => {
      try {
        if (!workspaceId) return;

        const isMember = await Membership.findOne({
          workspace: workspaceId,
          user: user._id,
          status: 'ACTIVE',
        });

        if (!isMember) {
          if (callback) callback({ success: false, error: 'Unauthorized workspace room access' });
          return;
        }

        const room = `workspace:${workspaceId}`;
        socket.join(room);

        // Update presence
        if (!workspacePresence.has(workspaceId)) {
          workspacePresence.set(workspaceId, new Set());
        }
        workspacePresence.get(workspaceId).add(userId);

        // Broadcast member:online to workspace room
        socket.to(room).emit('member:online', {
          userId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          workspaceId,
        });

        // Send currently online user IDs back to caller
        const onlineList = Array.from(workspacePresence.get(workspaceId));
        if (callback) {
          callback({ success: true, onlineMembers: onlineList });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    /**
     * Leave Workspace Room
     */
    socket.on('leave:workspace', (workspaceId) => {
      if (!workspaceId) return;
      const room = `workspace:${workspaceId}`;
      socket.leave(room);

      if (workspacePresence.has(workspaceId)) {
        workspacePresence.get(workspaceId).delete(userId);
        if (workspacePresence.get(workspaceId).size === 0) {
          workspacePresence.delete(workspaceId);
        }
      }

      socket.to(room).emit('member:offline', { userId, workspaceId });
    });

    /**
     * Handle Disconnection
     */
    socket.on('disconnect', () => {
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);

          // If no active sockets left, remove from all workspaces and notify
          for (const [wsId, userSet] of workspacePresence.entries()) {
            if (userSet.has(userId)) {
              userSet.delete(userId);
              ioInstance.to(`workspace:${wsId}`).emit('member:offline', {
                userId,
                workspaceId: wsId,
              });
            }
          }
        }
      }
    });
  });

  return ioInstance;
};

/**
 * Access the active Socket.IO server instance.
 */
export const getIO = () => ioInstance;

/**
 * Broadcast an event to all connected sockets in a workspace.
 */
export const broadcastToWorkspace = (workspaceId, event, data) => {
  if (ioInstance && workspaceId) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, data);
  }
};

/**
 * Broadcast an event directly to a specific user across all their devices.
 */
export const broadcastToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

export default {
  initSocket,
  getIO,
  broadcastToWorkspace,
  broadcastToUser,
};
