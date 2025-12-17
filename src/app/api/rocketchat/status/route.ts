import { NextResponse } from 'next/server'

export async function GET() {
  const ROCKETCHAT_URL = process.env.NEXT_PUBLIC_ROCKETCHAT_URL || 'http://localhost:3100'
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${ROCKETCHAT_URL}/api/info`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        available: true,
        version: data.version,
        url: ROCKETCHAT_URL,
      })
    } else {
      return NextResponse.json({
        available: false,
        error: 'Service responded with error',
        url: ROCKETCHAT_URL,
      })
    }
  } catch (err) {
    return NextResponse.json({
      available: false,
      error: err instanceof Error && err.name === 'AbortError' 
        ? 'Connection timed out' 
        : 'Rocket.Chat server not running',
      url: ROCKETCHAT_URL,
    })
  }
}

