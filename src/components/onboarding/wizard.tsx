'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Camera, Check, Loader2, Sparkles, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface OnboardingWizardProps {
  initialName: string
  initialAvatarUrl: string
  role: string
  department: string
}

const FOCUS_AREAS = [
  'Product Development',
  'Engineering',
  'Design',
  'Business Development',
  'Marketing',
  'Finance',
  'Legal & Compliance',
  'AI & Machine Learning',
  'Customer Success',
  'Operations',
  'Strategy',
  'People & Culture',
]

export function OnboardingWizard({ 
  initialName, 
  initialAvatarUrl, 
  role, 
  department 
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (error) {
      console.error('Avatar upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area)
      }
      if (prev.length >= 5) {
        return prev
      }
      return [...prev, area]
    })
  }

  const handleComplete = async () => {
    setIsSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          avatar_url: avatarUrl || null,
          focus_areas: selectedFocusAreas,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      router.push('/home')
      router.refresh()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step 
                ? 'w-8 bg-primary' 
                : s < step 
                  ? 'w-4 bg-primary/50' 
                  : 'w-4 bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="glass-strong rounded-3xl p-8 md:p-10 space-glow">
        {/* Step 1: Confirm Identity */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Space</h2>
              <p className="text-muted-foreground">Let&apos;s confirm your identity</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 bg-input/50 border-border/50"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <div className="flex-1 p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Role</p>
                  <p className="font-medium text-sm">{role}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="font-medium text-sm">{department}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Avatar */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-4">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your Profile Photo</h2>
              <p className="text-muted-foreground">Help your team recognize you</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div 
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="w-32 h-32 border-2 border-border">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-3xl bg-muted">
                    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">Click to upload a photo</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl"
              >
                {avatarUrl ? 'Continue' : 'Skip for now'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Focus Areas */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your Focus Areas</h2>
              <p className="text-muted-foreground">Select up to 5 areas you care about</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <Badge
                  key={area}
                  variant={selectedFocusAreas.includes(area) ? 'default' : 'outline'}
                  className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                    selectedFocusAreas.includes(area)
                      ? 'bg-primary hover:bg-primary/90'
                      : 'hover:bg-muted/50'
                  } ${
                    selectedFocusAreas.length >= 5 && !selectedFocusAreas.includes(area)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => toggleFocusArea(area)}
                >
                  {selectedFocusAreas.includes(area) && (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  {area}
                </Badge>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {selectedFocusAreas.length}/5 selected
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSaving}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Enter Space
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


