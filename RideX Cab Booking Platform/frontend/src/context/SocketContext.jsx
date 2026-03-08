import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) { try { socket.disconnect(); } catch {} }
      setSocket(null);
      return;
    }

    let s = null;
    // Dynamically import so a missing package won't crash the whole app
    import('socket.io-client')
      .then(({ io }) => {
        s = io('http://localhost:5000', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
        });
        s.on('connect', () => {
          s.emit('join', { userId: user._id, role: user.role });
        });
        s.on('connect_error', () => {
          // silent – backend may not be running
        });
        setSocket(s);
      })
      .catch(() => {
        // socket.io-client not installed – notifications will be polling only
      });

    return () => {
      if (s) { try { s.disconnect(); } catch {} }
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
