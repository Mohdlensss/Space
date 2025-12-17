'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send,
  Hash,
  Users,
  Search,
  MoreVertical,
  Smile,
  MessageSquare,
  Loader2,
  Wifi,
  WifiOff,
  Image as ImageIcon,
  X,
  RefreshCw,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Paperclip,
  Reply,
  Edit3,
  Trash2,
  Pin,
  AtSign,
  Settings,
  Plus,
  Check,
  Clock
} from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============ TYPES ============
interface ChatMessage {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string | null
  userRole: string
  channel: string
  timestamp: number
  type: 'text' | 'sticker' | 'file' | 'system'
  replyTo?: string
  reactions?: Record<string, string[]>
  edited?: boolean
  fileUrl?: string
  fileName?: string
  fileType?: string
}

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface CallState {
  status: CallStatus
  type: 'audio' | 'video' | null
  remoteUser: Profile | null
  isMuted: boolean
  isVideoOff: boolean
  duration: number
}

// ============ CONSTANTS ============
const CHANNELS = [
  { id: 'general', name: 'general', description: 'General discussions', icon: '💬' },
  { id: 'engineering', name: 'engineering', description: 'Engineering team', icon: '⚙️' },
  { id: 'product', name: 'product', description: 'Product updates', icon: '📦' },
  { id: 'random', name: 'random', description: 'Off-topic fun', icon: '🎲' },
  { id: 'announcements', name: 'announcements', description: 'Important updates', icon: '📢' },
]

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '🤲', '💪', '🙏', '✨', '🔥', '💯', '❤️', '🧡', '💛', '💚', '💙', '💜'],
  'Work': ['💻', '📱', '💡', '📊', '📈', '✅', '❌', '⚠️', '🚀', '🎯', '📝', '📋', '⏰', '🔔', '📧', '💼', '🏆', '🎉', '☕', '🍕'],
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

const STICKERS = {
  'DOO Team': [
    { id: 'thumbsup', emoji: '👍', label: 'Great!' },
    { id: 'rocket', emoji: '🚀', label: 'Ship it!' },
    { id: 'fire', emoji: '🔥', label: 'Fire!' },
    { id: 'celebration', emoji: '🎉', label: 'Celebrate!' },
    { id: 'coffee', emoji: '☕', label: 'Coffee time' },
    { id: 'brain', emoji: '🧠', label: 'Big brain' },
    { id: 'eyes', emoji: '👀', label: 'Looking...' },
    { id: 'check', emoji: '✅', label: 'Done!' },
  ],
  'Reactions': [
    { id: 'love', emoji: '❤️', label: 'Love it' },
    { id: 'laugh', emoji: '😂', label: 'LOL' },
    { id: 'wow', emoji: '😮', label: 'Wow!' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'angry', emoji: '😤', label: 'Frustrated' },
    { id: 'think', emoji: '🤔', label: 'Thinking...' },
    { id: 'clap', emoji: '👏', label: 'Applause' },
    { id: 'party', emoji: '🥳', label: 'Party!' },
  ],
}

// ============ STORAGE ============
function getStoredMessages(channel: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(`doo-chat-${channel}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function storeMessages(channel: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`doo-chat-${channel}`, JSON.stringify(messages.slice(-500)))
  } catch {
    // Ignore
  }
}

// ============ MAIN COMPONENT ============
export default function MessagesPage() {
  // State
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [showDMs, setShowDMs] = useState(false)
  const [activeDM, setActiveDM] = useState<Profile | null>(null)
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    type: null,
    remoteUser: null,
    isMuted: false,
    isVideoOff: false,
    duration: 0,
  })
  const [showCallUI, setShowCallUI] = useState(false)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // ============ HELPERS ============
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isUserOnline = (userId: string) => onlineUsers.has(userId)

  // ============ EFFECTS ============
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) setCurrentUser(profile)

        const { data: members } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .order('full_name')
        if (members) setTeamMembers(members)
      } catch (err) {
        console.error('Init error:', err)
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  useEffect(() => {
    const stored = getStoredMessages(activeDM ? `dm-${activeDM.id}` : activeChannel.id)
    setMessages(stored)
  }, [activeChannel, activeDM])

  // Realtime setup
  const setupRealtimeChannel = useCallback(() => {
    if (!currentUser) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    setConnectionStatus('connecting')
    const channelId = activeDM ? `dm-${[currentUser.id, activeDM.id].sort().join('-')}` : activeChannel.id

    const channel = supabase.channel(`doo-chat:${channelId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUser.id },
      },
    })

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const msg = payload as ChatMessage
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          const newMessages = [...prev, msg]
          storeMessages(channelId, newMessages)
          return newMessages
        })
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setTypingUsers(prev => new Set(prev).add(payload.userName))
          setTimeout(() => {
            setTypingUsers(prev => {
              const next = new Set(prev)
              next.delete(payload.userName)
              return next
            })
          }, 3000)
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        setMessages(prev => prev.map(m => {
          if (m.id === payload.messageId) {
            const reactions = { ...m.reactions }
            if (!reactions[payload.emoji]) reactions[payload.emoji] = []
            if (!reactions[payload.emoji].includes(payload.userId)) {
              reactions[payload.emoji].push(payload.userId)
            }
            return { ...m, reactions }
          }
          return m
        }))
      })
      .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
        if (payload.targetUserId === currentUser.id) {
          const caller = teamMembers.find(m => m.id === payload.fromUserId)
          setCallState({
            status: 'ringing',
            type: payload.callType,
            remoteUser: caller || null,
            isMuted: false,
            isVideoOff: false,
            duration: 0,
          })
          setShowCallUI(true)
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }) => {
        if (payload.targetUserId === currentUser.id) {
          endCall()
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(new Set(Object.keys(state)))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          await channel.track({ id: currentUser.id, name: currentUser.full_name })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error')
        }
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [activeChannel.id, activeDM, currentUser, supabase, teamMembers])

  useEffect(() => {
    if (currentUser) {
      const cleanup = setupRealtimeChannel()
      return cleanup
    }
  }, [setupRealtimeChannel, currentUser])

  // Call timer
  useEffect(() => {
    if (callState.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
  }, [callState.status])

  // ============ MESSAGE HANDLERS ============
  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const content = newMessage.trim()
    if (!content || !currentUser || sending) return

    setSending(true)
    setNewMessage('')
    setShowEmojiPicker(false)
    setShowStickerPicker(false)
    setReplyingTo(null)

    const channelId = activeDM ? `dm-${activeDM.id}` : activeChannel.id

    const msg: ChatMessage = {
      id: `${Date.now()}-${currentUser.id}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      userId: currentUser.id,
      userName: currentUser.full_name,
      userAvatar: currentUser.avatar_url,
      userRole: currentUser.role,
      channel: channelId,
      timestamp: Date.now(),
      type: 'text',
      replyTo: replyingTo?.id,
      reactions: {},
    }

    setMessages(prev => {
      const newMessages = [...prev, msg]
      storeMessages(channelId, newMessages)
      return newMessages
    })

    try {
      await channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
    } catch (err) {
      console.error('Send error:', err)
    }

    setSending(false)
    inputRef.current?.focus()
  }, [newMessage, currentUser, sending, activeDM, activeChannel.id, replyingTo])

  const sendSticker = async (sticker: { emoji: string }) => {
    if (!currentUser) return
    const channelId = activeDM ? `dm-${activeDM.id}` : activeChannel.id

    const msg: ChatMessage = {
      id: `${Date.now()}-${currentUser.id}-${Math.random().toString(36).substr(2, 9)}`,
      content: sticker.emoji,
      userId: currentUser.id,
      userName: currentUser.full_name,
      userAvatar: currentUser.avatar_url,
      userRole: currentUser.role,
      channel: channelId,
      timestamp: Date.now(),
      type: 'sticker',
      reactions: {},
    }

    setMessages(prev => [...prev, msg])
    setShowStickerPicker(false)
    await channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { messageId, emoji, userId: currentUser.id },
    })
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions }
        if (!reactions[emoji]) reactions[emoji] = []
        if (!reactions[emoji].includes(currentUser.id)) {
          reactions[emoji].push(currentUser.id)
        }
        return { ...m, reactions }
      }
      return m
    }))
    setSelectedMessage(null)
  }

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser?.id, userName: currentUser?.full_name },
    })
    typingTimeoutRef.current = setTimeout(() => {}, 3000)
  }

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '@') {
      setShowMentions(true)
    }
    // Let the form handle Enter key submission
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // For now, show file name (in production, upload to Supabase Storage)
    const msg: ChatMessage = {
      id: `${Date.now()}-${currentUser.id}`,
      content: `📎 ${file.name}`,
      userId: currentUser.id,
      userName: currentUser.full_name,
      userAvatar: currentUser.avatar_url,
      userRole: currentUser.role,
      channel: activeChannel.id,
      timestamp: Date.now(),
      type: 'file',
      fileName: file.name,
      fileType: file.type,
    }

    setMessages(prev => [...prev, msg])
    await channelRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
  }

  // ============ CALL HANDLERS ============
  const startCall = async (user: Profile, type: 'audio' | 'video') => {
    setCallState({
      status: 'calling',
      type,
      remoteUser: user,
      isMuted: false,
      isVideoOff: false,
      duration: 0,
    })
    setShowCallUI(true)

    await channelRef.current?.send({
      type: 'broadcast',
      event: 'call-offer',
      payload: {
        callType: type,
        targetUserId: user.id,
        fromUserId: currentUser?.id,
        fromUserName: currentUser?.full_name,
      },
    })

    // Start local media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Media error:', err)
    }
  }

  const answerCall = async () => {
    setCallState(prev => ({ ...prev, status: 'connected' }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.type === 'video',
      })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Media error:', err)
    }
  }

  const endCall = () => {
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    }
    if (callState.remoteUser) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { targetUserId: callState.remoteUser.id },
      })
    }
    setCallState({ status: 'idle', type: null, remoteUser: null, isMuted: false, isVideoOff: false, duration: 0 })
    setShowCallUI(false)
    if (callTimerRef.current) clearInterval(callTimerRef.current)
  }

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = (localVideoRef.current.srcObject as MediaStream).getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = (localVideoRef.current.srcObject as MediaStream).getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Loading DOO Chat...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Please sign in to use DOO Chat</p>
        </div>
      </div>
    )
  }

  const currentChannelId = activeDM ? `dm-${activeDM.id}` : activeChannel.id

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background relative">
      {/* Call UI Overlay */}
      {showCallUI && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
          <div className="text-center text-white mb-8">
            <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-white/20">
              <AvatarImage src={callState.remoteUser?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary">
                {callState.remoteUser ? getInitials(callState.remoteUser.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold mb-1">{callState.remoteUser?.full_name || 'Unknown'}</h2>
            <p className="text-gray-400">
              {callState.status === 'calling' && 'Calling...'}
              {callState.status === 'ringing' && 'Incoming call...'}
              {callState.status === 'connected' && formatDuration(callState.duration)}
            </p>
          </div>

          {/* Video preview */}
          {callState.type === 'video' && (
            <div className="relative w-full max-w-2xl aspect-video bg-gray-800 rounded-xl mb-8 overflow-hidden">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute bottom-4 right-4 w-32 h-24 rounded-lg object-cover bg-gray-700"
              />
            </div>
          )}

          {/* Call controls */}
          <div className="flex items-center gap-4">
            {callState.status === 'ringing' ? (
              <>
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={answerCall}
                >
                  <Phone className="w-6 h-6" />
                </Button>
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={endCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={callState.isMuted ? 'destructive' : 'secondary'}
                  className="w-14 h-14 rounded-full"
                  onClick={toggleMute}
                >
                  {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                {callState.type === 'video' && (
                  <Button
                    size="lg"
                    variant={callState.isVideoOff ? 'destructive' : 'secondary'}
                    className="w-14 h-14 rounded-full"
                    onClick={toggleVideo}
                  >
                    {callState.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>
                )}
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={endCall}
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-card hidden sm:flex">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              DOO Chat
            </h1>
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : connectionStatus === 'connecting' ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : (
              <button onClick={setupRealtimeChannel}><WifiOff className="w-4 h-4 text-red-500" /></button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{onlineUsers.size} online</p>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm flex-1" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {/* Channels */}
          <div className="px-2 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Channels</span>
            <Button variant="ghost" size="icon" className="h-5 w-5"><Plus className="w-3 h-3" /></Button>
          </div>
          
          {CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => { setActiveChannel(channel); setActiveDM(null); setShowDMs(false) }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                !activeDM && activeChannel.id === channel.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span>{channel.icon}</span>
              <Hash className="w-3 h-3" />
              {channel.name}
            </button>
          ))}

          {/* Direct Messages */}
          <div className="px-2 py-2 mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Direct Messages</span>
          </div>
          
          {teamMembers.filter(m => m.id !== currentUser.id).slice(0, 8).map((member) => (
            <button
              key={member.id}
              onClick={() => { setActiveDM(member); setShowDMs(true) }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                activeDM?.id === member.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <div className="relative">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                {isUserOnline(member.id) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card" />
                )}
              </div>
              <span className="truncate">{member.full_name}</span>
            </button>
          ))}
        </div>

        {/* Current User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(currentUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.role}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            {activeDM ? (
              <>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={activeDM.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(activeDM.full_name)}</AvatarFallback>
                </Avatar>
                <h2 className="font-semibold">{activeDM.full_name}</h2>
                {isUserOnline(activeDM.id) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
              </>
            ) : (
              <>
                <span className="text-lg">{activeChannel.icon}</span>
                <Hash className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">{activeChannel.name}</h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeDM && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startCall(activeDM, 'audio')}>
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startCall(activeDM, 'video')}>
                  <Video className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Connection Warning */}
        {connectionStatus !== 'connected' && (
          <div className={`px-4 py-2 text-sm flex items-center justify-between ${
            connectionStatus === 'connecting' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
          }`}>
            <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost'}</span>
            {connectionStatus !== 'connecting' && (
              <Button variant="ghost" size="sm" onClick={setupRealtimeChannel}>
                <RefreshCw className="w-3 h-3 mr-1" /> Reconnect
              </Button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {activeDM ? <MessageSquare className="w-8 h-8 text-primary" /> : <Hash className="w-8 h-8 text-primary" />}
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {activeDM ? `Chat with ${activeDM.full_name}` : `Welcome to #${activeChannel.name}`}
              </h3>
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1]?.userId !== message.userId
              const isSticker = message.type === 'sticker'
              const replyMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null

              return (
                <div 
                  key={message.id} 
                  className={`flex gap-3 group ${!showAvatar ? 'mt-0.5' : ''}`}
                  onMouseEnter={() => setSelectedMessage(message.id)}
                  onMouseLeave={() => setSelectedMessage(null)}
                >
                  {showAvatar ? (
                    <Avatar className="w-9 h-9 mt-0.5 shrink-0">
                      <AvatarImage src={message.userAvatar || undefined} />
                      <AvatarFallback className="text-xs bg-secondary">{getInitials(message.userName)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-9 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 relative">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{message.userName}</span>
                        <span className="text-[11px] text-muted-foreground">{message.userRole}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                        {message.edited && <span className="text-xs text-muted-foreground">(edited)</span>}
                      </div>
                    )}

                    {/* Reply indicator */}
                    {replyMessage && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 pl-2 border-l-2 border-primary/30">
                        <Reply className="w-3 h-3" />
                        <span className="font-medium">{replyMessage.userName}:</span>
                        <span className="truncate">{replyMessage.content.slice(0, 50)}</span>
                      </div>
                    )}

                    {isSticker ? (
                      <span className="text-5xl">{message.content}</span>
                    ) : (
                      <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs hover:bg-secondary/80"
                          >
                            {emoji} {users.length}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick actions */}
                    {selectedMessage === message.id && (
                      <div className="absolute -top-3 right-0 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-sm p-0.5">
                        {QUICK_REACTIONS.slice(0, 4).map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-1 text-xs text-muted-foreground flex items-center gap-1">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Reply preview */}
        {replyingTo && (
          <div className="px-4 py-2 border-t border-border bg-secondary/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="w-4 h-4 text-primary" />
              <span>Replying to <strong>{replyingTo.userName}</strong>: {replyingTo.content.slice(0, 40)}...</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-20 sm:w-80 bg-card border border-border rounded-xl shadow-lg z-40">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">Emojis</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEmojiPicker(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category} className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                  <div className="flex flex-wrap gap-1">
                    {emojis.map(emoji => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-secondary rounded">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticker Picker */}
        {showStickerPicker && (
          <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-20 sm:w-72 bg-card border border-border rounded-xl shadow-lg z-40">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">Stickers</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowStickerPicker(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {Object.entries(STICKERS).map(([category, stickers]) => (
                <div key={category} className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {stickers.map(sticker => (
                      <button key={sticker.id} onClick={() => sendSticker(sticker)} className="flex flex-col items-center p-2 hover:bg-secondary rounded-lg">
                        <span className="text-2xl">{sticker.emoji}</span>
                        <span className="text-[10px] text-muted-foreground">{sticker.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentions dropdown */}
        {showMentions && (
          <div className="absolute bottom-20 left-4 w-64 bg-card border border-border rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto">
            {teamMembers.filter(m => m.full_name.toLowerCase().includes(mentionSearch.toLowerCase())).map(member => (
              <button
                key={member.id}
                onClick={() => {
                  setNewMessage(prev => prev + `@${member.full_name} `)
                  setShowMentions(false)
                  setMentionSearch('')
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(member.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.full_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false) }}>
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            </Button>

            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); handleTyping() }}
                onKeyDown={handleKeyDown}
                placeholder={activeDM ? `Message ${activeDM.full_name}` : `Message #${activeChannel.name}`}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                disabled={sending}
                autoFocus
              />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false) }}>
                <Smile className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 shrink-0 rounded-xl" 
              disabled={!newMessage.trim() || sending}
              onClick={() => sendMessage()}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
