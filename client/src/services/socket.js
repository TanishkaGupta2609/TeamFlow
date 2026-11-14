import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize or get active Socket.IO connection.
 */
export const getSocket = () => {
  if (socket) return socket;

  const token = typeof window !== 'undefined' ? localStorage.getItem('teamflow_token') : null;
  const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: !!token,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

/**
 * Re-connect socket with fresh authentication token.
 */
export const connectSocketWithToken = (token) => {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    getSocket();
  }
};

/**
 * Disconnect and clean up socket.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join workspace real-time broadcast room.
 */
export const joinWorkspaceRoom = (workspaceId, onOnlineMembers) => {
  const s = getSocket();
  if (s && workspaceId) {
    s.emit('join:workspace', workspaceId, (response) => {
      if (response?.success && onOnlineMembers) {
        onOnlineMembers(response.onlineMembers || []);
      }
    });
  }
};

/**
 * Leave workspace real-time broadcast room.
 */
export const leaveWorkspaceRoom = (workspaceId) => {
  const s = getSocket();
  if (s && workspaceId) {
    s.emit('leave:workspace', workspaceId);
  }
};

export default {
  getSocket,
  connectSocketWithToken,
  disconnectSocket,
  joinWorkspaceRoom,
  leaveWorkspaceRoom,
};
