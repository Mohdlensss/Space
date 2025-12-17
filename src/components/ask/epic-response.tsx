'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ResponseBubble } from './response-bubble'
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'

interface EpicResponseProps {
  headline: string
  summary: string
  details: {
    type: 'insight' | 'task' | 'event' | 'email' | 'action' | 'metric' | 'warning' | 'tip'
    title: string
    content: string
  }[]
  sources?: string[]
  isStreaming?: boolean
}

/**
 * Epic Response Component
 * Shows large animated headline, then reveals detail bubbles
 */
export function EpicResponse({ headline, summary, details, sources, isStreaming }: EpicResponseProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [displayedHeadline, setDisplayedHeadline] = useState('')
  const [displayedSummary, setDisplayedSummary] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Typewriter effect for headline
  useEffect(() => {
    if (!headline) return
    
    let i = 0
    const timer = setInterval(() => {
      setDisplayedHeadline(headline.slice(0, i + 1))
      i++
      if (i >= headline.length) {
        clearInterval(timer)
        // Start summary after headline
        setTimeout(() => {
          let j = 0
          const summaryTimer = setInterval(() => {
            setDisplayedSummary(summary.slice(0, j + 1))
            j++
            if (j >= summary.length) {
              clearInterval(summaryTimer)
              // Show details after summary
              setTimeout(() => setShowDetails(true), 300)
            }
          }, 15)
        }, 200)
      }
    }, 30)
    
    return () => clearInterval(timer)
  }, [headline, summary])
  
  // Carousel controls
  const slidesPerView = 3
  const totalSlides = Math.ceil(details.length / slidesPerView)
  
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  
  const visibleDetails = details.slice(
    currentSlide * slidesPerView,
    (currentSlide + 1) * slidesPerView
  )

  return (
    <div className="space-y-6">
      {/* Hero Section - Large Animated Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative py-8"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100/50 via-purple-100/30 to-pink-100/50 rounded-3xl blur-3xl -z-10" />
        
        {/* Headline - Large & Bold */}
        <motion.h2 
          className={cn(
            'text-3xl md:text-4xl lg:text-5xl font-bold',
            'bg-gradient-to-r from-gray-900 via-violet-800 to-gray-900 bg-clip-text text-transparent',
            'tracking-tight leading-tight',
            'text-center'
          )}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {displayedHeadline}
          {isStreaming && displayedHeadline.length < headline.length && (
            <span className="inline-block w-[3px] h-8 bg-violet-500 ml-1 animate-pulse" />
          )}
        </motion.h2>
        
        {/* Summary - Subtitle */}
        <AnimatePresence>
          {displayedSummary && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg"
            >
              {displayedSummary}
              {isStreaming && displayedSummary.length < summary.length && (
                <span className="inline-block w-[2px] h-4 bg-violet-400 ml-1 animate-pulse" />
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Details Grid - Bubble Cards */}
      <AnimatePresence>
        {showDetails && details.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Carousel Navigation */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors"
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        i === currentSlide ? 'bg-violet-500' : 'bg-gray-300'
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors"
                  disabled={currentSlide === totalSlides - 1}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
            
            {/* Bubble Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDetails.map((detail, i) => (
                <ResponseBubble
                  key={`${currentSlide}-${i}`}
                  type={detail.type}
                  title={detail.title}
                  content={detail.content}
                  index={i}
                  total={visibleDetails.length}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sources */}
      {sources && sources.length > 0 && showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 text-xs text-gray-500 mt-4"
        >
          <Sparkles className="w-3 h-3" />
          <span>Sources: {sources.join(', ')}</span>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Parse AI response into structured format for EpicResponse
 */
export function parseAIResponse(text: string): EpicResponseProps {
  // Extract headline (first sentence or main point)
  const sentences = text.split(/[.!?]/).filter(s => s.trim())
  const headline = sentences[0]?.trim().slice(0, 60) || 'Here\'s what I found'
  
  // Extract summary (next 1-2 sentences)
  const summary = sentences.slice(1, 3).join('. ').trim().slice(0, 200) || ''
  
  // Extract details from bullet points or numbered items
  const details: EpicResponseProps['details'] = []
  const lines = text.split('\n')
  
  lines.forEach(line => {
    const cleanLine = line.trim()
    if (cleanLine.startsWith('-') || cleanLine.startsWith('•') || /^\d+\./.test(cleanLine)) {
      const content = cleanLine.replace(/^[-•\d.]+\s*/, '').trim()
      if (content.length > 10) {
        // Determine type based on content
        let type: EpicResponseProps['details'][0]['type'] = 'insight'
        if (content.toLowerCase().includes('task') || content.toLowerCase().includes('todo')) type = 'task'
        else if (content.toLowerCase().includes('meeting') || content.toLowerCase().includes('calendar')) type = 'event'
        else if (content.toLowerCase().includes('email') || content.toLowerCase().includes('message')) type = 'email'
        else if (content.toLowerCase().includes('action') || content.toLowerCase().includes('do')) type = 'action'
        else if (content.toLowerCase().includes('%') || content.toLowerCase().includes('metric')) type = 'metric'
        else if (content.toLowerCase().includes('warning') || content.toLowerCase().includes('urgent')) type = 'warning'
        else if (content.toLowerCase().includes('tip') || content.toLowerCase().includes('suggest')) type = 'tip'
        
        details.push({
          type,
          title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
          content,
        })
      }
    }
  })
  
  // If no bullet points, create details from paragraphs
  if (details.length === 0 && sentences.length > 3) {
    sentences.slice(3).forEach((sentence, i) => {
      if (sentence.trim().length > 20) {
        details.push({
          type: i % 2 === 0 ? 'insight' : 'tip',
          title: sentence.trim().slice(0, 40),
          content: sentence.trim(),
        })
      }
    })
  }
  
  // Extract sources
  const sourceMatch = text.match(/sources?:?\s*([^\n]+)/i)
  const sources = sourceMatch ? sourceMatch[1].split(',').map(s => s.trim()) : []
  
  return {
    headline,
    summary,
    details: details.slice(0, 9), // Max 9 items for 3x3 grid
    sources,
  }
}

