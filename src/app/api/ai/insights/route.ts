/**
 * AI Insights API Route
 * 
 * GET /api/ai/insights?type=personal|team|org&period=last_7_days
 * 
 * Returns aggregated insights based on user permissions:
 * - personal: visible only to the user (always allowed)
 * - team: visible only to managers (aggregated, no individual data)
 * - org: visible only to leadership (high-level only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildUserContext } from '@/lib/ai/permissions'
import {
  getPersonalInsights,
  getTeamInsights,
  getOrgInsights
} from '@/lib/ai/sentiment'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'personal'
    const period = searchParams.get('period') || 'last_7_days'
    const teamId = searchParams.get('teamId')
    
    // Validate type
    if (!['personal', 'team', 'org'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be personal, team, or org' },
        { status: 400 }
      )
    }
    
    // Get user context with permissions
    const userContext = await buildUserContext(user.id)
    if (!userContext) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    // Route to appropriate insights function
    switch (type) {
      case 'personal': {
        const insights = await getPersonalInsights(userContext, period)
        return NextResponse.json({
          type: 'personal',
          period,
          insights,
          privacyNote: 'This data is visible only to you.'
        })
      }
      
      case 'team': {
        // Check if user is a manager
        if (!userContext.isManager && !userContext.isLeadership) {
          return NextResponse.json(
            { 
              error: 'Access denied', 
              reason: 'Team insights are only available to managers and leadership'
            },
            { status: 403 }
          )
        }
        
        const insights = await getTeamInsights(
          userContext,
          teamId || userContext.department,
          period
        )
        
        return NextResponse.json({
          type: 'team',
          period,
          insights,
          privacyNote: 'This data is aggregated. No individual data is shown.'
        })
      }
      
      case 'org': {
        // Check if user is leadership
        if (!userContext.isLeadership) {
          return NextResponse.json(
            { 
              error: 'Access denied', 
              reason: 'Organization insights are only available to leadership'
            },
            { status: 403 }
          )
        }
        
        const insights = await getOrgInsights(userContext, period)
        
        return NextResponse.json({
          type: 'org',
          period,
          insights,
          privacyNote: 'This data is organization-level aggregated. No individual or team-specific data is shown.'
        })
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

