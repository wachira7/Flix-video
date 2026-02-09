// app/(dashboard)/watch-party/[partyCode]/page.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Users, MessageSquare, Copy, ExternalLink, LogOut, Crown, Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { watchPartyAPI } from "@/lib/api/watchparty"
import { watchPartySocket } from "@/lib/socket/watchparty-socket"
import { getUser } from "@/lib/auth"

interface Participant {
  socketId: string
  userId: string
  username: string
  isHost?: boolean
  avatarUrl?: string
}

interface ChatMessage {
  id?: string
  userId: string
  username: string
  message: string
  timestamp: string
  type?: 'text' | 'system' | 'reaction'
}

export default function PartyRoomPage() {
  const params = useParams()
  const router = useRouter()
  const partyCode = params.partyCode as string
  const currentUser = getUser()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Party state
  const [party, setParty] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)

  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState<string[]>([])

  // UI state
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(true)

  // Load party data
  useEffect(() => {
    loadParty()
  }, [partyCode])

  // Setup socket connection
  useEffect(() => {
    if (!party || !currentUser) return

    const socket = watchPartySocket.connect()

    // Join party room
    watchPartySocket.joinParty({
      partyId: party.id,
      userId: currentUser.id,
      username: currentUser.email.split('@')[0]
    })

    // Socket event listeners
    watchPartySocket.onJoinedParty((data) => {
      console.log('✅ Joined party:', data)
      toast.success('Connected to watch party!')
    })

    watchPartySocket.onPartyState((data) => {
      console.log('👥 Party state:', data)
      setParticipants(data.participants)
    })

    watchPartySocket.onUserJoined((data) => {
      console.log('👋 User joined:', data.username)
      setMessages(prev => [...prev, {
        userId: 'system',
        username: 'System',
        message: `${data.username} joined the party`,
        timestamp: data.timestamp,
        type: 'system'
      }])
      toast(`${data.username} joined!`, { icon: '👋' })
    })

    watchPartySocket.onUserLeft((data) => {
      console.log('🚪 User left:', data.username)
      setMessages(prev => [...prev, {
        userId: 'system',
        username: 'System',
        message: `${data.username} left the party`,
        timestamp: data.timestamp,
        type: 'system'
      }])
    })

    // Video sync events
    watchPartySocket.onPlay((data) => {
      console.log('▶️ Remote play:', data)
      if (videoRef.current && !isHost) {
        videoRef.current.currentTime = data.timestamp
        videoRef.current.play()
        setIsPlaying(true)
      }
      toast(`${data.username} played the video`, { icon: '▶️' })
    })

    watchPartySocket.onPause((data) => {
      console.log('⏸️ Remote pause:', data)
      if (videoRef.current && !isHost) {
        videoRef.current.currentTime = data.timestamp
        videoRef.current.pause()
        setIsPlaying(false)
      }
      toast(`${data.username} paused the video`, { icon: '⏸️' })
    })

    watchPartySocket.onSeek((data) => {
      console.log('⏩ Remote seek:', data)
      if (videoRef.current && !isHost) {
        videoRef.current.currentTime = data.timestamp
      }
      toast(`${data.username} seeked to ${Math.floor(data.timestamp)}s`, { icon: '⏩' })
    })

    // Chat events
    watchPartySocket.onChatMessage((data) => {
      console.log('💬 Chat message:', data)
      setMessages(prev => [...prev, {
        id: data.id,
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: data.timestamp
      }])
    })

    watchPartySocket.onChatHistory((data) => {
      console.log('📜 Chat history:', data.messages.length)
      const formattedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        userId: msg.user_id,
        username: msg.username || msg.email.split('@')[0],
        message: msg.content,
        timestamp: msg.created_at
      }))
      setMessages(formattedMessages)
    })

    watchPartySocket.onReaction((data) => {
      setMessages(prev => [...prev, {
        userId: data.userId,
        username: data.username,
        message: data.emoji,
        timestamp: data.timestamp,
        type: 'reaction'
      }])
    })

    watchPartySocket.onUserTyping((data) => {
      setIsTyping(prev => [...prev, data.username])
      setTimeout(() => {
        setIsTyping(prev => prev.filter(u => u !== data.username))
      }, 3000)
    })

    watchPartySocket.onUserStopTyping((data) => {
      setIsTyping(prev => prev.filter(u => u !== data.username))
    })

    watchPartySocket.onError((error) => {
      console.error('❌ Socket error:', error)
      toast.error(error.message || 'Connection error')
    })

    // Request chat history
    watchPartySocket.getChatHistory(50)

    // Cleanup
    return () => {
      watchPartySocket.leaveParty()
      watchPartySocket.removeAllListeners()
    }
  }, [party, currentUser, isHost])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadParty = async () => {
    try {
      setLoading(true)
      const response = await watchPartyAPI.getByCode(partyCode)
      setParty(response.party)
      setIsHost(response.party.host_user_id === currentUser?.id)
    } catch (error) {
      console.error('Failed to load party:', error)
      toast.error('Party not found')
      router.push('/watch-party')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      watchPartySocket.pause(videoRef.current.currentTime)
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      watchPartySocket.play(videoRef.current.currentTime)
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    videoRef.current.currentTime = newTime
    watchPartySocket.seek(newTime)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    watchPartySocket.sendMessage({ message: newMessage})
    setNewMessage('')
    watchPartySocket.stopTyping()
  }

  const handleTyping = () => {
    watchPartySocket.typing()
  }

  const sendReaction = (emoji: string) => {
    watchPartySocket.sendReaction({ emoji: emoji })
  }

  const copyPartyCode = () => {
    navigator.clipboard.writeText(partyCode)
    toast.success('Party code copied!')
  }

  const copyPartyLink = () => {
    const link = `${window.location.origin}/watch-party/${partyCode}`
    navigator.clipboard.writeText(link)
    toast.success('Party link copied!')
  }

  const leaveParty = async () => {
    try {
      await watchPartyAPI.leave(party.id)
      router.push('/watch-party')
    } catch (error) {
      toast.error('Failed to leave party')
    }
  }

  const endParty = async () => {
    if (!confirm('Are you sure you want to end this watch party?')) return

    try {
      await watchPartyAPI.end(party.id)
      toast.success('Party ended')
      router.push('/watch-party')
    } catch (error) {
      toast.error('Failed to end party')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading watch party...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">{party?.title}</h1>
            {party?.content_type === 'tv_show' && (
              <Badge variant="outline">S{party.season_number}E{party.episode_number}</Badge>
            )}
            {isHost && (
              <Badge className="bg-yellow-600">
                <Crown className="w-3 h-3 mr-1" />
                Host
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Party Code */}
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded">
              <code className="text-purple-400 font-mono font-bold">{partyCode}</code>
              <Button size="sm" variant="ghost" onClick={copyPartyCode}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={copyPartyLink}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {/* Leave/End Button */}
            {isHost ? (
              <Button variant="destructive" onClick={endParty}>
                End Party
              </Button>
            ) : (
              <Button variant="outline" onClick={leaveParty}>
                <LogOut className="w-4 h-4 mr-2" />
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Video Player */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 bg-black relative group">
            <video
              ref={videoRef}
              className="w-full h-full"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              {/* Placeholder - In production, load actual video */}
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            </video>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress Bar */}
              <div 
                className="w-full h-2 bg-gray-700 rounded-full mb-4 cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white"
                    disabled={!isHost}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </Button>

                  <span className="text-white text-sm">
                    {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / 
                    {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isHost && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      Only host can control video
                    </Badge>
                  )}
                  <Button size="icon" variant="ghost" className="text-white">
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white">
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reactions */}
          <div className="bg-gray-900 p-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm mr-2">Quick reactions:</span>
              {['😂', '❤️', '🔥', '👏', '😮', '👍'].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => { setShowChat(true); setShowParticipants(false) }}
              className={`flex-1 p-4 font-semibold transition-colors ${
                showChat ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'
              }`}
            >
              <MessageSquare className="w-5 h-5 inline mr-2" />
              Chat
            </button>
            <button
              onClick={() => { setShowChat(false); setShowParticipants(true) }}
              className={`flex-1 p-4 font-semibold transition-colors ${
                showParticipants ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              People ({participants.length})
            </button>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${msg.type === 'system' ? 'text-center' : ''}`}
                    >
                      {msg.type === 'system' ? (
                        <p className="text-xs text-gray-500">{msg.message}</p>
                      ) : msg.type === 'reaction' ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-2xl">{msg.message}</span>
                          <span className="text-gray-400">{msg.username}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-purple-400 text-sm">
                              {msg.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{msg.message}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Typing Indicator */}
              {isTyping.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500">
                  {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  placeholder="Type a message..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </form>
            </>
          )}

         {/* Participants Panel */}
            {showParticipants && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {participants.map((participant) => (
                <Card
                    key={participant.socketId}
                    className="flex items-center gap-3 p-3 bg-gray-800 border-gray-700 hover:border-purple-600 transition-all"
                >
                    <Avatar>
                    <AvatarImage src={participant.avatarUrl} />
                    <AvatarFallback className="bg-purple-600">
                        {participant.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                    <p className="text-white font-semibold">{participant.username}</p>
                    {participant.isHost && (
                        <Badge className="bg-yellow-600 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Host
                        </Badge>
                    )}
                    </div>
                </Card>
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  )
}