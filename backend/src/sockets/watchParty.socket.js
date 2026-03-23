// src/sockets/watchParty.socket.js
const logger = require('../utils/logger');
const WatchPartyMessage = require('../models/watchPartyMessage.model');

const watchPartySocketHandler = (io) => {
  const watchPartyNamespace = io.of('/watch-party');

  watchPartyNamespace.on('connection', (socket) => {
    logger.info(`🎬 Watch party socket connected: ${socket.id}`);

    socket.on('join-party', async (data) => {
      try {
        const { partyId, userId, username } = data;
        socket.join(partyId);
        socket.partyId = partyId;
        socket.userId = userId;
        socket.username = username;

        logger.info(`✅ ${username} joined party: ${partyId}`);

        socket.to(partyId).emit('user-joined', {
          userId, username, timestamp: new Date().toISOString()
        });

        socket.emit('joined-party', { partyId, message: 'Successfully joined watch party' });

        const roomSockets = await watchPartyNamespace.in(partyId).fetchSockets();
        const participants = roomSockets.map(s => ({
          socketId: s.id, userId: s.userId, username: s.username
        }));

        socket.emit('party-state', { participants, participantCount: participants.length });

      } catch (error) {
        logger.error('Join party error', { error: error.message });
        socket.emit('error', { message: 'Failed to join party' });
      }
    });

    socket.on('leave-party', () => {
      if (socket.partyId) {
        logger.info(`👋 ${socket.username} left party: ${socket.partyId}`);
        socket.to(socket.partyId).emit('user-left', {
          userId: socket.userId, username: socket.username, timestamp: new Date().toISOString()
        });
        socket.leave(socket.partyId);
        socket.partyId = null;
      }
    });

    socket.on('play', (data) => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('play', {
          timestamp: data.timestamp, userId: socket.userId, username: socket.username
        });
      }
    });

    socket.on('pause', (data) => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('pause', {
          timestamp: data.timestamp, userId: socket.userId, username: socket.username
        });
      }
    });

    socket.on('seek', (data) => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('seek', {
          timestamp: data.timestamp, userId: socket.userId, username: socket.username
        });
      }
    });

    socket.on('update-timestamp', async (data) => {
      if (socket.partyId) {
        try {
          await global.pgPool.query(
            'UPDATE watch_parties SET video_position = $1 WHERE id = $2',
            [data.timestamp, socket.partyId]
          );
        } catch (error) {
          logger.error('Update timestamp error', { error: error.message });
        }
      }
    });

    // ── Chat Message → MongoDB ──────────────────────────────────
    socket.on('chat-message', async (data) => {
      if (socket.partyId) {
        try {
          const savedMessage = await WatchPartyMessage.create({
            partyId: socket.partyId,
            userId: socket.userId,
            username: socket.username,
            type: 'text',
            content: data.message
          });

          watchPartyNamespace.to(socket.partyId).emit('chat-message', {
            id: savedMessage._id,
            userId: socket.userId,
            username: socket.username,
            message: data.message,
            timestamp: savedMessage.createdAt
          });

        } catch (error) {
          logger.error('Chat message error', { error: error.message });
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    });

    // ── Reaction → MongoDB ──────────────────────────────────────
    socket.on('reaction', async (data) => {
      if (socket.partyId) {
        try {
          await WatchPartyMessage.create({
            partyId: socket.partyId,
            userId: socket.userId,
            username: socket.username,
            type: 'reaction',
            content: data.emoji
          });

          watchPartyNamespace.to(socket.partyId).emit('reaction', {
            userId: socket.userId,
            username: socket.username,
            emoji: data.emoji,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Reaction error', { error: error.message });
        }
      }
    });

    // ── Chat History from MongoDB ───────────────────────────────
    socket.on('get-chat-history', async (data) => {
      if (socket.partyId) {
        try {
          const messages = await WatchPartyMessage.getByParty(
            socket.partyId,
            data.limit || 50
          );
          socket.emit('chat-history', { messages });
        } catch (error) {
          logger.error('Get chat history error', { error: error.message });
          socket.emit('error', { message: 'Failed to load chat history' });
        }
      }
    });

    socket.on('typing', () => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('user-typing', {
          userId: socket.userId, username: socket.username
        });
      }
    });

    socket.on('stop-typing', () => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('user-stop-typing', {
          userId: socket.userId, username: socket.username
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.partyId) {
        logger.info(`❌ ${socket.username} disconnected from party: ${socket.partyId}`);
        socket.to(socket.partyId).emit('user-left', {
          userId: socket.userId, username: socket.username, timestamp: new Date().toISOString()
        });
      }
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = watchPartySocketHandler;