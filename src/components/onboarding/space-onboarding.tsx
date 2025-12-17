'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Mail, CheckSquare, Users, MessageSquare, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface OnboardingProps {
  userName: string
  userRole: string
  onComplete: () => void
}

interface Slide {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

const getSlides = (role: string): Slide[] => {
  const isLeadership = ['CEO', 'COO', 'Chief', 'Director', 'VP'].some(r => role.includes(r))
  const isEngineer = ['Engineer', 'Developer', 'Product', 'Tech'].some(r => role.includes(r))
  const isBD = ['Business', 'Sales', 'BD', 'Growth'].some(r => role.includes(r))

  const baseSlides: Slide[] = [
    {
      id: 1,
      icon: <Sparkles className="w-12 h-12 text-white" />,
      title: 'Welcome to Space',
      description: 'Your intelligent workspace that knows everything about DOO. Ask anything, get instant answers.',
      gradient: 'from-violet-600 via-purple-600 to-indigo-600'
    },
    {
      id: 2,
      icon: <Calendar className="w-12 h-12 text-white" />,
      title: 'Your Calendar, Connected',
      description: 'All your meetings, synced and intelligent. Space knows your schedule and helps you prioritize.',
      gradient: 'from-blue-600 via-cyan-600 to-teal-600'
    },
    {
      id: 3,
      icon: <Mail className="w-12 h-12 text-white" />,
      title: 'Email Intelligence',
      description: 'Important emails surface automatically. Never miss a critical customer message or urgent request.',
      gradient: 'from-emerald-600 via-green-600 to-teal-600'
    },
    {
      id: 4,
      icon: <CheckSquare className="w-12 h-12 text-white" />,
      title: 'Tasks & Linear',
      description: 'Your Linear issues, sprint progress, and blockers — all visible at a glance.',
      gradient: 'from-amber-600 via-orange-600 to-red-600'
    }
  ]

  // Add role-specific slides
  if (isLeadership) {
    baseSlides.push({
      id: 5,
      icon: <Users className="w-12 h-12 text-white" />,
      title: 'Team Insights',
      description: 'See aggregated team health, workload balance, and impact metrics. Lead with clarity.',
      gradient: 'from-pink-600 via-rose-600 to-red-600'
    })
  }

  if (isEngineer) {
    baseSlides.push({
      id: 5,
      icon: <CheckSquare className="w-12 h-12 text-white" />,
      title: 'Sprint Command Center',
      description: 'Your assigned issues, cycle progress, and blockers — all in one place.',
      gradient: 'from-indigo-600 via-blue-600 to-cyan-600'
    })
  }

  if (isBD) {
    baseSlides.push({
      id: 5,
      icon: <MessageSquare className="w-12 h-12 text-white" />,
      title: 'Deal Intelligence',
      description: 'Customer emails, meeting prep, and deal progress — Space has your back.',
      gradient: 'from-green-600 via-emerald-600 to-teal-600'
    })
  }

  // Final slide
  baseSlides.push({
    id: 6,
    icon: <Sparkles className="w-12 h-12 text-white" />,
    title: "You're All Set",
    description: 'Start by asking Space anything. "Summarize my week" or "What are my priorities?"',
    gradient: 'from-violet-600 via-purple-600 to-pink-600'
  })

  return baseSlides
}

export function SpaceOnboarding({ userName, userRole, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const slides = getSlides(userRole)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    localStorage.setItem('space-onboarding-complete', 'true')
    setTimeout(onComplete, 500)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        {/* Background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight,
                scale: 0
              }}
              animate={{ 
                y: [null, Math.random() * -200],
                scale: [0, 1, 0],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg mx-4"
        >
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>

          {/* Card */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${slides[currentSlide].gradient} p-8 shadow-2xl`}>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg"
                >
                  {slides[currentSlide].icon}
                </motion.div>

                {/* Welcome text for first slide */}
                {currentSlide === 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/80 text-sm mb-2"
                  >
                    Hello, {userName.split(' ')[0]} 👋
                  </motion.p>
                )}

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-white mb-3"
                >
                  {slides[currentSlide].title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/80 text-lg leading-relaxed mb-8"
                >
                  {slides[currentSlide].description}
                </motion.p>

                {/* Progress dots */}
                <div className="flex items-center gap-2 mb-6">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>

                {/* Action button */}
                <Button
                  onClick={handleNext}
                  className="w-full h-14 rounded-xl bg-white text-gray-900 hover:bg-white/90 font-semibold text-base shadow-lg"
                >
                  {currentSlide === slides.length - 1 ? (
                    <>
                      Get Started
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DOO logo */}
          <div className="flex justify-center mt-6">
            <Image 
              src="/doo-logo.svg" 
              alt="DOO" 
              width={40} 
              height={40}
              className="opacity-50"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isComplete, setIsComplete] = useState(true)

  useEffect(() => {
    const complete = localStorage.getItem('space-onboarding-complete')
    if (!complete) {
      setShowOnboarding(true)
      setIsComplete(false)
    }
  }, [])

  const completeOnboarding = () => {
    setShowOnboarding(false)
    setIsComplete(true)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('space-onboarding-complete')
    setShowOnboarding(true)
    setIsComplete(false)
  }

  return { showOnboarding, isComplete, completeOnboarding, resetOnboarding }
}

