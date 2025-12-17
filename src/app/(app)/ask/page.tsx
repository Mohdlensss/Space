'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Mic, RefreshCw, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EpicResponse, parseAIResponse } from '@/components/ask/epic-response'
import { SpacingOutLoader } from '@/components/ui/spacing-out-loader'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  error?: boolean
}

const SUGGESTED_QUESTIONS = [
  "What's on my calendar today?",
  "What are my priority tasks?",
  "Summarize my week",
  "What's blocking the team?",
]

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    // Create placeholder for assistant message
    const assistantId = `assistant-${Date.now()}`
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }])

    try {
      // Use streaming endpoint
      const response = await fetch('/api/ai/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullContent, isStreaming: true }
                      : m
                  ))
                }
                if (data.done) {
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, isStreaming: false }
                      : m
                  ))
                }
              } catch (e) {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Ask Space error:', err)
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Unable to connect to AI service. Please try again.', error: true, isStreaming: false }
          : m
      ))
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const runDiagnostics = async () => {
    try {
      const res = await fetch('/api/ai/health')
      const data = await res.json()
      alert(data.ok 
        ? 'AI service is healthy! ✅' 
        : `AI issue: ${data.message} (${data.error_code || 'unknown'})`)
    } catch {
      alert('Could not reach AI health endpoint')
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Ask Space</h1>
            <p className="text-xs text-gray-500">Your intelligent workspace assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-6">
              <Zap className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              What would you like to know?
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              I can help with your calendar, tasks, emails, and provide insights about DOO.
            </p>
            
            {/* Suggested Questions */}
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(q)}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm text-left',
                    'bg-white/60 backdrop-blur-sm border border-gray-100',
                    'hover:bg-white hover:border-violet-200 hover:shadow-md',
                    'transition-all duration-200'
                  )}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-end"
                  >
                    <div className={cn(
                      'max-w-md px-4 py-3 rounded-2xl rounded-br-md',
                      'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    )}>
                      {message.content}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    {message.error ? (
                      <div className={cn(
                        'p-6 rounded-2xl',
                        'bg-gradient-to-br from-red-50 to-orange-50',
                        'border border-red-200/50'
                      )}>
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-red-800">Unable to connect</span>
                        </div>
                        <p className="text-sm text-red-600 mb-4">{message.content}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={runDiagnostics}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Run diagnostics
                        </Button>
                      </div>
                    ) : message.isStreaming && !message.content ? (
                      <div className="flex items-center gap-3 py-8">
                        <SpacingOutLoader size="md" text="Spacing out" />
                      </div>
                    ) : (
                      <EpicResponse 
                        {...parseAIResponse(message.content)}
                        isStreaming={message.isStreaming}
                      />
                    )}
                  </motion.div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your work..."
              disabled={isLoading}
              className={cn(
                'w-full px-5 py-3.5 pr-12 rounded-xl',
                'bg-white border border-gray-200',
                'focus:border-violet-300 focus:ring-2 focus:ring-violet-100',
                'outline-none transition-all',
                'placeholder:text-gray-400'
              )}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'h-12 px-5 rounded-xl',
              'bg-gradient-to-r from-violet-600 to-purple-600',
              'hover:from-violet-700 hover:to-purple-700',
              'disabled:opacity-50'
            )}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Space AI • Powered by DOO Intelligence
        </p>
      </div>
    </div>
  )
}
