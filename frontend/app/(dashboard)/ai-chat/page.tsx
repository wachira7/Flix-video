"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Brain, Send, Plus, Trash2, MessageSquare, Bot, User, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { apiClient } from "@/lib/api/client"
import { v4 as uuidv4 } from "uuid"

// ── Types ──────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  tokensUsed?: number
}

interface Conversation {
  sessionId: string
  messages: Message[]
  provider: string
  createdAt: string
  updatedAt: string
}

// ── AI API helpers ────────────────────────────────────────────────
const aiAPI = {
  async sendMessage(message: string, sessionId: string) {
    const response = await apiClient.post("/api/ai/chat", { message, session_id: sessionId })
    return response.data
  },
  async getConversations() {
    const response = await apiClient.get("/api/ai/conversations")
    return response.data
  },
  async getConversation(sessionId: string) {
    const response = await apiClient.get(`/api/ai/conversations/${sessionId}`)
    return response.data
  },
  async deleteConversation(sessionId: string) {
    const response = await apiClient.delete(`/api/ai/conversations/${sessionId}`)
    return response.data
  },
  async getStatus() {
    const response = await apiClient.get("/api/ai/status")
    return response.data
  },
}

// ── Component ─────────────────────────────────────────────────────
export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => uuidv4())
  const [conversations, setConversations] = useState<any[]>([])
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [provider, setProvider] = useState<string>("claude")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAIStatus()
    loadConversations()
  }, [])

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const checkAIStatus = async () => {
    try {
      const response = await aiAPI.getStatus()
      setAiStatus(response.ai_providers)
    } catch (error) {
      console.error("Failed to check AI status:", error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await aiAPI.getConversations()
      setConversations(response.conversations || [])
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadConversation = async (sid: string) => {
    try {
      const response = await aiAPI.getConversation(sid)
      const conv: Conversation = response.conversation
      setSessionId(sid)
      setMessages(
        conv.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          tokensUsed: m.tokensUsed,
        }))
      )
    } catch (error) {
      toast.error("Failed to load conversation")
    }
  }

  const startNewChat = () => {
    setSessionId(uuidv4())
    setMessages([])
    inputRef.current?.focus()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await aiAPI.sendMessage(userMessage.content, sessionId)

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        tokensUsed: response.tokens_used,
      }

      setMessages(prev => [...prev, assistantMessage])
      setProvider(response.provider || "claude")

      // Refresh conversation list
      loadConversations()

    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to get AI response"
      )
      // Remove the user message if AI failed
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteConversation = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiAPI.deleteConversation(sid)
      setConversations(prev => prev.filter(c => c.sessionId !== sid))
      if (sid === sessionId) startNewChat()
      toast.success("Conversation deleted")
    } catch (error) {
      toast.error("Failed to delete conversation")
    }
  }

  const suggestedPrompts = [
    "Recommend me a thriller movie similar to Inception",
    "What are the best sci-fi TV shows from the last 5 years?",
    "I enjoyed Breaking Bad, what should I watch next?",
    "Suggest a feel-good movie for a family movie night",
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-950">

      {/* ── Sidebar: Conversation History ──────────────────────── */}
      <div className="w-72 border-r border-gray-800 flex flex-col bg-gray-900">
        <div className="p-4 border-b border-gray-800">
          <Button
            onClick={startNewChat}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="p-3 border-b border-gray-800">
          {aiStatus && (
            <div className="flex items-center gap-2">
              <Badge className={aiStatus.available_count > 0 ? "bg-green-700" : "bg-red-700"}>
                {aiStatus.available_count > 0
                  ? <><CheckCircle2 className="w-3 h-3 mr-1" />AI Ready</>
                  : <><AlertCircle className="w-3 h-3 mr-1" />Unavailable</>
                }
              </Badge>
              {aiStatus.available_count > 0 && (
                <span className="text-xs text-gray-500">
                  {aiStatus.primary_provider === "claude" ? "Claude AI" : "GPT-4"}
                </span>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          {loadingHistory ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-gray-800" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={() => loadConversation(conv.sessionId)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    conv.sessionId === sessionId
                      ? "bg-purple-900/50 border border-purple-700"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {conv.messages?.[0]?.content || "New conversation"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
                    onClick={(e) => deleteConversation(conv.sessionId, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Movie Assistant</h1>
            <p className="text-xs text-gray-400">
              Powered by {provider === "claude" ? "Claude AI" : "GPT-4"} — Ask me anything about movies & TV
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                What would you like to watch?
              </h2>
              <p className="text-gray-400 text-center mb-8 max-w-md">
                Ask me for movie recommendations, TV show suggestions, or anything about the world of cinema.
              </p>

              {/* Suggested prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                    className="text-left p-3 rounded-lg border border-gray-700 hover:border-purple-600 bg-gray-800/50 hover:bg-gray-800 transition-all text-sm text-gray-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-purple-600"
                        : "bg-gray-700"
                    }`}>
                      {msg.role === "user"
                        ? <User className="w-4 h-4 text-white" />
                        : <Bot className="w-4 h-4 text-purple-400" />
                      }
                    </div>

                    {/* Message bubble */}
                    <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-tr-sm"
                          : "bg-gray-800 text-gray-100 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-500 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {msg.tokensUsed ? ` · ${msg.tokensUsed} tokens` : ""}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about movies, TV shows, recommendations..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-600 resize-none"
              disabled={loading || (aiStatus && aiStatus.available_count === 0)}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading || (aiStatus && aiStatus.available_count === 0)}
              className="bg-purple-600 hover:bg-purple-700 shrink-0"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>

      </div>
    </div>
  )
}