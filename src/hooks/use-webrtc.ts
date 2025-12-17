'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type CallType = 'video' | 'audio'
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface CallState {
  status: CallStatus
  callType: CallType | null
  remoteUserId: string | null
  remoteUserName: string | null
  isMuted: boolean
  isVideoOff: boolean
  callDuration: number
}

interface UseWebRTCOptions {
  channelId: string
  userId: string
  userName: string
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

export function useWebRTC({ channelId, userId, userName }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    callType: null,
    remoteUserId: null,
    remoteUserName: null,
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
  })

  const supabase = createClient()
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteStream = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const signalingChannel = useRef<RealtimeChannel | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize signaling channel
  useEffect(() => {
    const channel = supabase.channel(`calls:${channelId}`)
    
    channel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        if (payload.targetUserId === userId) {
          // Incoming call
          setCallState(prev => ({
            ...prev,
            status: 'ringing',
            callType: payload.callType,
            remoteUserId: payload.fromUserId,
            remoteUserName: payload.fromUserName,
          }))
        }
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        if (payload.targetUserId === userId && peerConnection.current) {
          const answer = new RTCSessionDescription(payload.answer)
          await peerConnection.current.setRemoteDescription(answer)
          setCallState(prev => ({ ...prev, status: 'connected' }))
          startCallTimer()
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.targetUserId === userId && peerConnection.current) {
          const candidate = new RTCIceCandidate(payload.candidate)
          await peerConnection.current.addIceCandidate(candidate)
        }
      })
      .on('broadcast', { event: 'call-reject' }, ({ payload }) => {
        if (payload.targetUserId === userId) {
          endCall()
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }) => {
        if (payload.targetUserId === userId) {
          endCall()
        }
      })
      .subscribe()

    signalingChannel.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, userId, supabase])

  const startCallTimer = useCallback(() => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }))
    }, 1000)
  }, [])

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
  }, [])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannel.current && callState.remoteUserId) {
        signalingChannel.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            targetUserId: callState.remoteUserId,
            fromUserId: userId,
          },
        })
      }
    }

    pc.ontrack = (event) => {
      remoteStream.current = event.streams[0]
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall()
      }
    }

    peerConnection.current = pc
    return pc
  }, [callState.remoteUserId, userId])

  const startCall = useCallback(async (
    targetUserId: string,
    targetUserName: string,
    callType: CallType
  ) => {
    try {
      setCallState(prev => ({
        ...prev,
        status: 'calling',
        callType,
        remoteUserId: targetUserId,
        remoteUserName: targetUserName,
      }))

      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video',
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStream.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const pc = createPeerConnection()
      
      // Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send offer via signaling
      signalingChannel.current?.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: {
          offer,
          callType,
          targetUserId,
          fromUserId: userId,
          fromUserName: userName,
        },
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (callState.status === 'calling') {
          endCall()
        }
      }, 30000)
    } catch (error) {
      console.error('Failed to start call:', error)
      endCall()
    }
  }, [createPeerConnection, userId, userName, callState.status])

  const answerCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const constraints = {
        audio: true,
        video: callState.callType === 'video',
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStream.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const pc = createPeerConnection()
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      signalingChannel.current?.send({
        type: 'broadcast',
        event: 'call-answer',
        payload: {
          answer,
          targetUserId: callState.remoteUserId,
          fromUserId: userId,
        },
      })

      setCallState(prev => ({ ...prev, status: 'connected' }))
      startCallTimer()
    } catch (error) {
      console.error('Failed to answer call:', error)
      endCall()
    }
  }, [callState.callType, callState.remoteUserId, createPeerConnection, userId, startCallTimer])

  const acceptCall = useCallback(async () => {
    // Get the offer from the signaling channel
    // This is simplified - in production you'd store the offer
    if (signalingChannel.current) {
      // For now, we'll handle this through the broadcast event
      setCallState(prev => ({ ...prev, status: 'connected' }))
    }
  }, [])

  const rejectCall = useCallback(() => {
    signalingChannel.current?.send({
      type: 'broadcast',
      event: 'call-reject',
      payload: {
        targetUserId: callState.remoteUserId,
        fromUserId: userId,
      },
    })
    endCall()
  }, [callState.remoteUserId, userId])

  const endCall = useCallback(() => {
    // Stop all tracks
    localStream.current?.getTracks().forEach(track => track.stop())
    remoteStream.current?.getTracks().forEach(track => track.stop())

    // Close peer connection
    peerConnection.current?.close()
    peerConnection.current = null

    // Clear refs
    localStream.current = null
    remoteStream.current = null

    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

    // Notify other user
    if (callState.remoteUserId) {
      signalingChannel.current?.send({
        type: 'broadcast',
        event: 'call-end',
        payload: {
          targetUserId: callState.remoteUserId,
          fromUserId: userId,
        },
      })
    }

    stopCallTimer()

    setCallState({
      status: 'idle',
      callType: null,
      remoteUserId: null,
      remoteUserName: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    })
  }, [callState.remoteUserId, userId, stopCallTimer])

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration,
  }
}

