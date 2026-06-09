import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// One shared socket instance for the whole app.
// We keep it connected while any component needs it,
// and track how many callers are currently active.
let sharedSocket = null;
let refCount = 0;

const getOrCreateSocket = () => {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
};

// Keep callback refs so we can update them without re-subscribing
const useSocket = (snippetId, user, { onCodeUpdate, onPresenceUpdate, onCursorUpdate } = {}) => {
  const socketRef = useRef(null);

  // Always-fresh callback refs — updated every render
  const onCodeUpdateRef    = useRef(onCodeUpdate);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);
  const onCursorUpdateRef  = useRef(onCursorUpdate);
  useEffect(() => { onCodeUpdateRef.current    = onCodeUpdate;    });
  useEffect(() => { onPresenceUpdateRef.current = onPresenceUpdate; });
  useEffect(() => { onCursorUpdateRef.current  = onCursorUpdate;  });

  useEffect(() => {
    if (!snippetId) return;

    const sock = getOrCreateSocket();
    socketRef.current = sock;
    refCount++;

    // Stable wrappers that delegate to the always-fresh refs
    const handleCodeUpdate     = (data) => onCodeUpdateRef.current?.(data);
    const handlePresenceUpdate = (data) => onPresenceUpdateRef.current?.(data);
    const handleCursorUpdate   = (data) => onCursorUpdateRef.current?.(data);

    const joinRoom = () => {
      sock.emit('join-room', { snippetId, user });
    };

    // Join immediately (socket may already be connected)
    if (sock.connected) {
      joinRoom();
    }

    // Re-join after reconnect
    sock.on('connect', joinRoom);
    sock.on('code-update',     handleCodeUpdate);
    sock.on('presence-update', handlePresenceUpdate);
    sock.on('cursor-update',   handleCursorUpdate);

    return () => {
      sock.emit('leave-room', { snippetId });
      sock.off('connect',          joinRoom);
      sock.off('code-update',      handleCodeUpdate);
      sock.off('presence-update',  handlePresenceUpdate);
      sock.off('cursor-update',    handleCursorUpdate);

      refCount--;
      // Disconnect only when no component is using the socket
      if (refCount <= 0) {
        refCount = 0;
        sock.disconnect();
        sharedSocket = null;
      }
    };
  }, [snippetId]);

  const emitCodeChange = useCallback((code, cursorPosition) => {
    socketRef.current?.emit('code-change', { snippetId, code, cursorPosition });
  }, [snippetId]);

  const emitCursorMove = useCallback((position) => {
    socketRef.current?.emit('cursor-move', { snippetId, position, user });
  }, [snippetId, user]);

  return { emitCodeChange, emitCursorMove };
};

export default useSocket;
