//backend/src/sockets/watchParty.socket.js
/**
 * Watch Party Socket Handlers
 * Real-time synchronization for watch parties
 */

const watchPartySocketHandler = (io) => {
  const watchPartyNamespace = io.of('/watch-party');

  watchPartyNamespace.on('connection', (socket) => {
    console.log(`🎬 Watch party socket connected: ${socket.id}`);

    // Join a watch party room
    socket.on('join-party', async (data) => {
      try {
        const { partyId, userId, username } = data;

        // Join the room
        socket.join(partyId);
        
        // Store user info in socket
        socket.partyId = partyId;
        socket.userId = userId;
        socket.username = username;

        console.log(`✅ ${username} joined party: ${partyId}`);

        // Notify others in the party
        socket.to(partyId).emit('user-joined', {
          userId,
          username,
          timestamp: new Date().toISOString()
        });

        // Send confirmation to user
        socket.emit('joined-party', {
          partyId,
          message: 'Successfully joined watch party'
        });

        // Get current party state and send to new user
        const roomSockets = await watchPartyNamespace.in(partyId).fetchSockets();
        const participants = roomSockets.map(s => ({
          socketId: s.id,
          userId: s.userId,
          username: s.username
        }));

        socket.emit('party-state', {
          participants,
          participantCount: participants.length
        });

      } catch (error) {
        console.error('Join party error:', error);
        socket.emit('error', { message: 'Failed to join party' });
      }
    });

    // Leave watch party
    socket.on('leave-party', () => {
      if (socket.partyId) {
        console.log(`👋 ${socket.username} left party: ${socket.partyId}`);
        
        socket.to(socket.partyId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date().toISOString()
        });

        socket.leave(socket.partyId);
        socket.partyId = null;
      }
    });

    // Video control: Play
    socket.on('play', (data) => {
      if (socket.partyId) {
        console.log(`▶️ Play event in party ${socket.partyId} at ${data.timestamp}s`);
        
        socket.to(socket.partyId).emit('play', {
          timestamp: data.timestamp,
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Video control: Pause
    socket.on('pause', (data) => {
      if (socket.partyId) {
        console.log(`⏸️ Pause event in party ${socket.partyId} at ${data.timestamp}s`);
        
        socket.to(socket.partyId).emit('pause', {
          timestamp: data.timestamp,
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Video control: Seek
    socket.on('seek', (data) => {
      if (socket.partyId) {
        console.log(`⏩ Seek event in party ${socket.partyId} to ${data.timestamp}s`);
        
        socket.to(socket.partyId).emit('seek', {
          timestamp: data.timestamp,
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Update video timestamp (for sync)
    socket.on('update-timestamp', async (data) => {
      if (socket.partyId) {
        // Update in database
        try {
          await global.pgPool.query(
            'UPDATE watch_parties SET video_position = $1 WHERE id = $2',
            [data.timestamp, socket.partyId]
          );
        } catch (error) {
          console.error('Update timestamp error:', error);
        }
      }
    });

    // Chat message
    socket.on('chat-message', async (data) => {
      if (socket.partyId) {
        try {
          const { message } = data;

          // Save to database
          const result = await global.pgPool.query(
            `INSERT INTO watch_party_messages (party_id, user_id, message_type, content)
             VALUES ($1, $2, 'text', $3)
             RETURNING *`,
            [socket.partyId, socket.userId, message]
          );

          const savedMessage = result.rows[0];

          // Broadcast to all in party (including sender)
          watchPartyNamespace.to(socket.partyId).emit('chat-message', {
            id: savedMessage.id,
            userId: socket.userId,
            username: socket.username,
            message,
            timestamp: savedMessage.created_at
          });

        } catch (error) {
          console.error('Chat message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    });

    // Reaction (emoji)
    socket.on('reaction', async (data) => {
      if (socket.partyId) {
        try {
          const { emoji } = data;

          // Save to database
          await global.pgPool.query(
            `INSERT INTO watch_party_messages (party_id, user_id, message_type, content)
             VALUES ($1, $2, 'reaction', $3)`,
            [socket.partyId, socket.userId, emoji]
          );

          // Broadcast to all in party
          watchPartyNamespace.to(socket.partyId).emit('reaction', {
            userId: socket.userId,
            username: socket.username,
            emoji,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Reaction error:', error);
        }
      }
    });

    // Get chat history
    socket.on('get-chat-history', async (data) => {
      if (socket.partyId) {
        try {
          const { limit = 50 } = data;

          const result = await global.pgPool.query(
            `SELECT wpm.*, u.email, up.username, up.full_name
             FROM watch_party_messages wpm
             JOIN users u ON wpm.user_id = u.id
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE wpm.party_id = $1
             ORDER BY wpm.created_at DESC
             LIMIT $2`,
            [socket.partyId, limit]
          );

          // Send chat history (reverse to get chronological order)
          socket.emit('chat-history', {
            messages: result.rows.reverse()
          });

        } catch (error) {
          console.error('Get chat history error:', error);
          socket.emit('error', { message: 'Failed to load chat history' });
        }
      }
    });

    // Typing indicator
    socket.on('typing', () => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('user-typing', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Stop typing indicator
    socket.on('stop-typing', () => {
      if (socket.partyId) {
        socket.to(socket.partyId).emit('user-stop-typing', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (socket.partyId) {
        console.log(`❌ ${socket.username} disconnected from party: ${socket.partyId}`);
        
        socket.to(socket.partyId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date().toISOString()
        });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = watchPartySocketHandler;
