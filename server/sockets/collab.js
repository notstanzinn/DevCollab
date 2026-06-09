const rooms = new Map(); // snippetId -> Map of socketId -> { socketId, userId, name, avatar }
const roomCode = new Map(); // snippetId -> latest code string (so late joiners get the current state)

const setupCollabSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Join a snippet room ────────────────────────────────────────────────────
    socket.on('join-room', ({ snippetId, user }) => {
      socket.join(snippetId);

      if (!rooms.has(snippetId)) {
        rooms.set(snippetId, new Map());
      }
      rooms.get(snippetId).set(socket.id, {
        socketId: socket.id,
        userId:   user?._id,
        name:     user?.name   || 'Anonymous',
        avatar:   user?.avatar || '',
      });

      // Send the joiner the latest in-memory code so they're in sync immediately
      const latestCode = roomCode.get(snippetId);
      if (latestCode !== undefined) {
        socket.emit('code-update', { code: latestCode, senderId: 'server' });
      }

      // Broadcast updated presence list to everyone in the room
      const presence = Array.from(rooms.get(snippetId).values());
      io.to(snippetId).emit('presence-update', presence);
      console.log(`👥 ${user?.name || 'Anonymous'} joined room ${snippetId} (${presence.length} users)`);
    });

    // ── Code change broadcast ─────────────────────────────────────────────────
    socket.on('code-change', ({ snippetId, code, cursorPosition }) => {
      // Keep the latest code in memory for late joiners
      roomCode.set(snippetId, code);
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(snippetId).emit('code-update', { code, cursorPosition, senderId: socket.id });
    });

    // ── Cursor position broadcast ─────────────────────────────────────────────
    socket.on('cursor-move', ({ snippetId, position, user }) => {
      socket.to(snippetId).emit('cursor-update', {
        socketId: socket.id,
        position,
        name: user?.name,
      });
    });

    // ── Leave room explicitly ─────────────────────────────────────────────────
    socket.on('leave-room', ({ snippetId }) => {
      handleLeave(socket, snippetId, io);
    });

    // ── Handle disconnect ─────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      for (const [snippetId] of rooms) {
        if (rooms.get(snippetId)?.has(socket.id)) {
          handleLeave(socket, snippetId, io);
        }
      }
    });
  });
};

const handleLeave = (socket, snippetId, io) => {
  socket.leave(snippetId);
  const room = rooms.get(snippetId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) {
      rooms.delete(snippetId);
      roomCode.delete(snippetId); // clear code cache when room is empty
    } else {
      const presence = Array.from(room.values());
      io.to(snippetId).emit('presence-update', presence);
    }
  }
};

module.exports = setupCollabSockets;
