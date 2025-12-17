/**
 * Data Sync API Route
 * 
 * POST /api/ai/sync - Force sync all data sources
 * GET /api/ai/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAllDataForUser } from '@/lib/ai/dataSync'
import { getIndexStats } from '@/lib/ai/retrieval'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Force sync all data
    const result = await syncAllDataForUser(user.id)
    
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: 'Data sync complete! Ask Space now has fresh context.'
    })
    
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  const stats = getIndexStats()
  
  return NextResponse.json({
    indexed: stats.total,
    bySource: stats.bySource,
    sources: [
      { name: 'Google Calendar', key: 'calendar_event', description: 'Your meetings and events' },
      { name: 'Linear', key: 'linear_issue', description: 'Your tasks and issues' },
      { name: 'Gmail', key: 'email', description: 'Important emails' },
      { name: 'Team Info', key: 'shared_document', description: 'DOO team structure and context' }
    ]
  })
}

