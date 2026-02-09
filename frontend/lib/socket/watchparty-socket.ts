// lib/socket/watchparty-socket.ts

import { io, Socket } from 'socket.io-client'

interface JoinPartyData {
  partyId: string
  userId: string
  username: string
}

interface VideoControlData {
  timestamp: number
}

interface ChatMessageData {
  message: string
}

interface ReactionData {
  emoji: string
}

interface PartyState {
  participants: Array<{
    socketId: string
    userId: string
    username: string
  }>
  participantCount: number
}

class WatchPartySocket {
  private socket: Socket | null = null
  private isConnected: boolean = false

  /**
   * Connect to watch party namespace
   */
  connect(): Socket {
    if (this.socket && this.isConnected) {
      return this.socket
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    this.socket = io(`${SOCKET_URL}/watch-party`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('🎬 Connected to watch party socket')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from watch party socket')
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    return this.socket
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  /**
   * Join a watch party room
   */
  joinParty(data: JoinPartyData): void {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    this.socket.emit('join-party', data)
  }

  /**
   * Leave current watch party
   */
  leaveParty(): void {
    if (!this.socket) return
    this.socket.emit('leave-party')
  }

  /**
   * Send play event
   */
  play(timestamp: number): void {
    if (!this.socket) return
    this.socket.emit('play', { timestamp })
  }

  /**
   * Send pause event
   */
  pause(timestamp: number): void {
    if (!this.socket) return
    this.socket.emit('pause', { timestamp })
  }

  /**
   * Send seek event
   */
  seek(timestamp: number): void {
    if (!this.socket) return
    this.socket.emit('seek', { timestamp })
  }

  /**
   * Update video timestamp
   */
  updateTimestamp(timestamp: number): void {
    if (!this.socket) return
    this.socket.emit('update-timestamp', { timestamp })
  }

  /**
   * Send chat message
   */
  sendMessage(data: ChatMessageData): void {
    if (!this.socket) return
    this.socket.emit('chat-message', data)
    }

  /**
   * Send reaction
   */
  sendReaction(data: ReactionData): void {
    if (!this.socket) return
    this.socket.emit('reaction', data)
  }

  /**
   * Get chat history
   */
  getChatHistory(limit: number = 50): void {
    if (!this.socket) return
    this.socket.emit('get-chat-history', { limit })
  }

  /**
   * Send typing indicator
   */
  typing(): void {
    if (!this.socket) return
    this.socket.emit('typing')
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (!this.socket) return
    this.socket.emit('stop-typing')
  }

  // Event listeners
  onJoinedParty(callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on('joined-party', callback)
  }

  onPartyState(callback: (data: PartyState) => void): void {
    if (!this.socket) return
    this.socket.on('party-state', callback)
  }

  onUserJoined(callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on('user-joined', callback)
  }

  onUserLeft(callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on('user-left', callback)
  }

  onPlay(callback: (data: VideoControlData & { userId: string; username: string }) => void): void {
    if (!this.socket) return
    this.socket.on('play', callback)
  }

  onPause(callback: (data: VideoControlData & { userId: string; username: string }) => void): void {
    if (!this.socket) return
    this.socket.on('pause', callback)
  }

  onSeek(callback: (data: VideoControlData & { userId: string; username: string }) => void): void {
    if (!this.socket) return
    this.socket.on('seek', callback)
  }

  onChatMessage(callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on('chat-message', callback)
  }

  onChatHistory(callback: (data: { messages: any[] }) => void): void {
    if (!this.socket) return
    this.socket.on('chat-history', callback)
  }

  onReaction(callback: (data: any) => void): void {
    if (!this.socket) return
    this.socket.on('reaction', callback)
  }

  onUserTyping(callback: (data: { userId: string; username: string }) => void): void {
    if (!this.socket) return
    this.socket.on('user-typing', callback)
  }

  onUserStopTyping(callback: (data: { userId: string; username: string }) => void): void {
    if (!this.socket) return
    this.socket.on('user-stop-typing', callback)
  }

  onError(callback: (error: any) => void): void {
    if (!this.socket) return
    this.socket.on('error', callback)
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return
    this.socket.removeAllListeners()
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null
  }
}

// Export singleton instance
export const watchPartySocket = new WatchPartySocket()