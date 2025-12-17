import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Use service role to create tables
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Create channels table if not exists
    const { error: channelsError } = await supabaseAdmin.rpc('create_channels_table')
    
    if (channelsError && !channelsError.message.includes('already exists')) {
      // Table might already exist, continue
      console.log('Channels table check:', channelsError.message)
    }

    // Create messages table if not exists  
    const { error: messagesError } = await supabaseAdmin.rpc('create_messages_table')
    
    if (messagesError && !messagesError.message.includes('already exists')) {
      console.log('Messages table check:', messagesError.message)
    }

    // Insert default channels
    const defaultChannels = [
      { name: 'general', description: 'General discussions for the whole team', is_direct: false },
      { name: 'engineering', description: 'Engineering team discussions', is_direct: false },
      { name: 'product', description: 'Product updates and discussions', is_direct: false },
      { name: 'random', description: 'Off-topic conversations', is_direct: false },
    ]

    // Check if channels exist
    const { data: existingChannels } = await supabaseAdmin
      .from('channels')
      .select('name')
    
    if (!existingChannels || existingChannels.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('channels')
        .insert(defaultChannels)
      
      if (insertError) {
        console.log('Insert channels error:', insertError.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chat setup error:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

