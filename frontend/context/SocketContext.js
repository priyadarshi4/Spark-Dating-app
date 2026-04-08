import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const listenersRef = useRef({});

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('spark_token');
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:matches');
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('user:online',  ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on('user:offline', ({ userId }) => setOnlineUsers(prev => { const n = new Set(prev); n.delete(userId); return n; }));

    socket.on('notification:new', (notif) => {
      // Emit to registered listeners
      Object.values(listenersRef.current['notification:new'] || {}).forEach(fn => fn(notif));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // ── Subscribe to a socket event ───────────────────────────────
  const on = (event, id, handler) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
    if (!listenersRef.current[event]) listenersRef.current[event] = {};
    listenersRef.current[event][id] = handler;
    return () => off(event, id);
  };

  const off = (event, id) => {
    if (socketRef.current && listenersRef.current[event]?.[id]) {
      socketRef.current.off(event, listenersRef.current[event][id]);
      delete listenersRef.current[event][id];
    }
  };

  const emit = (event, data, cb) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, cb);
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
