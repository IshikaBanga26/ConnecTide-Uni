"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useSocket } from "@/hooks/useSocket"
import { DashboardLayout } from "@/components/shared/DashboardLayout"

type Message = {
  id: string
  content: string
  senderId: string
  createdAt: string
  isRead: boolean
  sender: { id: string; profile: { name: string; avatar?: string | null } | null }
}

type Conversation = {
  id: string
  otherUser: { id: string; profile: { name: string; avatar?: string | null } | null } | null
  lastMessage: { content: string; senderId: string } | null
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#134E4A", "#2DD4BF"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

function Avatar({ name, avatar, size = 36 }: { name: string; avatar?: string | null; size?: number }) {
  const [bg, text] = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: bg, color: text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, overflow: "hidden",
    }}>
      {avatar
        ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : name[0]?.toUpperCase()
      }
    </div>
  )
}

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { socket, connected, onlineUsers } = useSocket()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [fetchingMsgs, setFetchingMsgs] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Load conversations
  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/chat/conversations")
    const data = await res.json()
    if (data.success) setConversations(data.data)
  }, [])

  useEffect(() => { if (user) loadConversations() }, [user, loadConversations])

  // If ?with=userId in URL, open or create that conversation
  useEffect(() => {
    if (!user) return
    // Use a small timeout to ensure we're fully in the browser
    // and window.location is populated with the actual URL
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const withUserId = params.get("with")
      if (!withUserId) return

      fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: withUserId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setActiveConvId(data.data.id)
            loadConversations()
          } else {
            console.error("Conversation error:", data.error)
          }
        })
        .catch(err => console.error("Chat error:", err))
    }, 100)

    return () => clearTimeout(timer)
  }, [user, loadConversations])

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return
    setFetchingMsgs(true)
    fetch(`/api/chat/messages?conversationId=${activeConvId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setMessages(data.data)
        setFetchingMsgs(false)
      })
  }, [activeConvId])

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !activeConvId) return

    socket.emit("conversation:join", activeConvId)

    socket.on("message:new", (message: Message) => {
      setMessages(prev => [...prev, message])
      // Mark as read if we're looking at this conversation
      socket.emit("messages:read", { conversationId: activeConvId })
    })

    socket.on("typing:start", ({ userId }: { userId: string }) => {
      setTypingUsers(prev => new Set([...prev, userId]))
    })

    socket.on("typing:stop", ({ userId }: { userId: string }) => {
      setTypingUsers(prev => { const next = new Set(prev); next.delete(userId); return next })
    })

    return () => {
      socket.off("message:new")
      socket.off("typing:start")
      socket.off("typing:stop")
    }
  }, [socket, activeConvId])

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !socket || !activeConvId) return
    socket.emit("message:send", { conversationId: activeConvId, content: input.trim() })
    setInput("")
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    socket.emit("typing:stop", { conversationId: activeConvId })
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (!socket || !activeConvId) return

    socket.emit("typing:start", { conversationId: activeConvId })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socket?.emit("typing:stop", { conversationId: activeConvId })
    }, 1500)
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherUser = activeConv?.otherUser

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{
        display: "flex", gap: "0", height: "calc(100vh - 80px)",
        backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden",
      }}>

        {/* Conversation list */}
        <div style={{
          width: "280px", flexShrink: 0,
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "16px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", margin: 0 }}>
              Messages
            </p>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: connected ? "var(--teal)" : "var(--text-muted)",
            }} title={connected ? "Connected" : "Disconnected"} />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  No conversations yet. Go to a student&apos;s profile and click Message to start chatting.
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = conv.otherUser
                const name = other?.profile?.name ?? "Unknown"
                const isActive = conv.id === activeConvId
                const isOnline = other ? onlineUsers.has(other.id) : false

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    style={{
                      padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px",
                      cursor: "pointer", transition: "background-color 0.15s ease",
                      backgroundColor: isActive ? "var(--accent-light)" : "transparent",
                      borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)" }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar name={name} avatar={other?.profile?.avatar} size={38} />
                      {isOnline && (
                        <div style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: "10px", height: "10px", borderRadius: "50%",
                          backgroundColor: "var(--teal)",
                          border: "2px solid var(--bg-card)",
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "13px", color: isActive ? "var(--accent)" : "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </p>
                      {conv.lastMessage && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {conv.lastMessage.senderId === user?.id ? "You: " : ""}
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!activeConvId ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Select a conversation
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Or go to a student profile and click Message
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: "12px 20px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                {otherUser && (
                  <>
                    <div style={{ position: "relative" }}>
                      <Avatar
                        name={otherUser.profile?.name ?? "?"}
                        avatar={otherUser.profile?.avatar}
                        size={34}
                      />
                      {onlineUsers.has(otherUser.id) && (
                        <div style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: "9px", height: "9px", borderRadius: "50%",
                          backgroundColor: "var(--teal)", border: "2px solid var(--bg-card)",
                        }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>
                        {otherUser.profile?.name ?? "Unknown"}
                      </p>
                      <p style={{ fontSize: "11px", color: onlineUsers.has(otherUser.id) ? "var(--teal-text)" : "var(--text-muted)", margin: 0 }}>
                        {onlineUsers.has(otherUser.id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {fetchingMsgs ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No messages yet — say hi!
                  </p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.senderId === user?.id
                    return (
                      <div key={msg.id} style={{
                        display: "flex", justifyContent: isMine ? "flex-end" : "flex-start",
                        gap: "8px", alignItems: "flex-end",
                      }}>
                        {!isMine && (
                          <Avatar
                            name={msg.sender.profile?.name ?? "?"}
                            avatar={msg.sender.profile?.avatar}
                            size={26}
                          />
                        )}
                        <div style={{
                          maxWidth: "65%", padding: "8px 12px", borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          backgroundColor: isMine ? "var(--accent)" : "var(--bg-elevated)",
                          color: isMine ? "var(--bg-primary)" : "var(--text-primary)",
                          fontSize: "13px", lineHeight: 1.5,
                        }}>
                          {msg.content}
                          <p style={{ fontSize: "10px", opacity: 0.6, margin: "4px 0 0", textAlign: isMine ? "right" : "left" }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {isMine && msg.isRead && " ✓✓"}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "3px", padding: "8px 12px", backgroundColor: "var(--bg-elevated)", borderRadius: "16px 16px 16px 4px" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          backgroundColor: "var(--text-muted)",
                          animation: `bounce 1.2s ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
                <input
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: "10px 14px",
                    backgroundColor: "var(--bg-input)", border: "1px solid var(--border)",
                    borderRadius: "20px", color: "var(--text-primary)", fontSize: "13px",
                    fontFamily: "inherit", outline: "none",
                  }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !connected}
                  style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    backgroundColor: input.trim() && connected ? "var(--accent)" : "var(--bg-elevated)",
                    color: input.trim() && connected ? "var(--bg-primary)" : "var(--text-muted)",
                    border: "none", cursor: input.trim() && connected ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.15s ease", fontSize: "16px",
                  }}
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </DashboardLayout>
  )
}
