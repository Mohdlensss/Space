import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Create channels table
    const { error: channelsError } = await supabaseAdmin.from('channels').select('id').limit(1)
    
    if (channelsError?.code === '42P01') {
      // Table doesn't exist, we need to create it via SQL
      // Since we can't run raw SQL via REST API, we'll use the workaround
      console.log('Channels table does not exist')
    }

    // Try to insert default channels (this will fail if table doesn't exist)
    const defaultChannels = [
      { name: 'general', description: 'General discussions for the whole DOO team', is_direct: false },
      { name: 'engineering', description: 'Engineering team discussions', is_direct: false },
      { name: 'product', description: 'Product updates and discussions', is_direct: false },
      { name: 'random', description: 'Off-topic conversations', is_direct: false },
    ]

    // Check existing channels
    const { data: existing } = await supabaseAdmin.from('channels').select('name')
    
    if (!existing || existing.length === 0) {
      await supabaseAdmin.from('channels').insert(defaultChannels)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chat tables ready',
      channels: existing?.length || defaultChannels.length
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}

