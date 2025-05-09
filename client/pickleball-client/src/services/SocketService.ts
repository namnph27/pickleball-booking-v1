import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';
import type { Notification } from '../types/index';

// Socket.io instance
let socket: Socket | null = null;

// Connection status
const isConnected = ref(false);

// Create a composable for Socket.io
export function useSocketService() {
  const authStore = useAuthStore();

  // Initialize Socket.io connection
  const initializeSocket = () => {
    if (socket) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    socket = io(apiUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('Socket.io connected');
      isConnected.value = true;
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      isConnected.value = false;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      isConnected.value = false;
    });
  };

  // Disconnect Socket.io
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnected.value = false;
    }
  };

  // Listen for notifications
  const onNotification = (callback: (notification: Notification) => void) => {
    if (!socket) return;

    socket.on('notification', callback);

    return () => {
      socket.off('notification', callback);
    };
  };

  // Listen for join requests
  const onJoinRequest = (callback: (joinRequest: any) => void) => {
    if (!socket) return;

    socket.on('join_request', callback);

    return () => {
      socket.off('join_request', callback);
    };
  };

  // Listen for join request responses
  const onJoinRequestResponse = (callback: (response: any) => void) => {
    if (!socket) return;

    socket.on('join_request_response', callback);

    return () => {
      socket.off('join_request_response', callback);
    };
  };

  // Cleanup function that can be called when component is unmounted
  const cleanup = () => {
    if (socket) {
      socket.off('notification');
      socket.off('join_request');
      socket.off('join_request_response');
    }
  };

  return {
    isConnected,
    initializeSocket,
    disconnectSocket,
    onNotification,
    onJoinRequest,
    onJoinRequestResponse,
    cleanup
  };
}
