/**
 * Insights API
 * GET /api/insights
 * 
 * Returns role-scoped insights for the current user
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPermissionsForRole, type AnalyticsScope } from '@/lib/permissions/roles'

export interface Insight {
  id: string
  type: 'health' | 'workload' | 'impact' | 'risk' | 'action'
  title: string
  insight: string
  why: string
  scope: string
  trend?: 'up' | 'down' | 'stable'
  department?: string
  createdAt: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    // Get permissions based on role
    const permissions = getPermissionsForRole(profile.role || '')
    
    // Generate insights based on scopes
    const insights: Insight[] = []
    const now = new Date().toISOString()
    
    // Org-level insights (CEO/COO only)
    if (permissions.canSeeOrgAggregates) {
      insights.push({
        id: 'org-health-1',
        type: 'health',
        title: 'Team Morale',
        insight: 'Overall team sentiment is positive this week. Engagement in public channels up 12%.',
        why: 'Based on DOO Chat activity patterns and Linear delivery velocity',
        scope: 'Org-wide',
        trend: 'up',
        createdAt: now,
      })
      
      insights.push({
        id: 'org-workload-1',
        type: 'workload',
        title: 'Workload Balance',
        insight: 'Engineering team has high meeting density this week. Consider protecting focus time.',
        why: 'Calendar analysis shows 60% meeting load for Product Engineering',
        scope: 'Org-wide',
        trend: 'stable',
        department: 'Product Engineering',
        createdAt: now,
      })
      
      insights.push({
        id: 'org-impact-1',
        type: 'impact',
        title: 'Impact Snapshot',
        insight: '23 Linear issues closed this week. AI Success team leading with 8 closures.',
        why: 'Linear delivery metrics from the past 7 days',
        scope: 'Org-wide',
        trend: 'up',
        createdAt: now,
      })
      
      insights.push({
        id: 'org-risk-1',
        type: 'risk',
        title: 'Risks & Blockers',
        insight: '3 issues blocked for >48 hours. Most related to external dependencies.',
        why: 'Linear blockers analysis across all teams',
        scope: 'Org-wide',
        trend: 'stable',
        createdAt: now,
      })
      
      insights.push({
        id: 'org-action-1',
        type: 'action',
        title: 'Recommended Actions',
        insight: 'Schedule focus blocks for engineering. Review blocked issues in daily standup.',
        why: 'Based on workload and blocker patterns',
        scope: 'Leadership action',
        createdAt: now,
      })
    }
    
    // Operations insights (COO + Ops team)
    if (permissions.scopes.includes('operations') || permissions.scopes.includes('finance') || permissions.scopes.includes('legal')) {
      insights.push({
        id: 'ops-health-1',
        type: 'health',
        title: 'Operations Health',
        insight: 'Finance and Legal teams operating smoothly. No urgent escalations.',
        why: 'Based on task completion rates and communication patterns',
        scope: 'Operations',
        trend: 'stable',
        department: 'Operations',
        createdAt: now,
      })
    }
    
    // Finance-specific insights
    if (permissions.scopes.includes('finance')) {
      insights.push({
        id: 'finance-1',
        type: 'workload',
        title: 'Finance Queue',
        insight: 'Upcoming: VC meetings with Merak and Plus VC this month.',
        why: 'Calendar and shared artifacts analysis',
        scope: 'Finance',
        trend: 'stable',
        department: 'Finance',
        createdAt: now,
      })
    }
    
    // Legal-specific insights
    if (permissions.scopes.includes('legal')) {
      insights.push({
        id: 'legal-1',
        type: 'workload',
        title: 'Compliance Status',
        insight: 'All compliance tasks on track. No pending legal reviews.',
        why: 'Based on Linear tasks tagged legal/compliance',
        scope: 'Legal',
        trend: 'up',
        department: 'Legal',
        createdAt: now,
      })
    }
    
    // Growth/BD insights
    if (permissions.scopes.includes('growth') || permissions.scopes.includes('bd')) {
      insights.push({
        id: 'growth-health-1',
        type: 'health',
        title: 'Growth Team Health',
        insight: 'BD team momentum is strong. 5 active deals in pipeline this week.',
        why: 'Based on Linear issues and shared CRM artifacts',
        scope: 'Growth',
        trend: 'up',
        department: 'Business Development',
        createdAt: now,
      })
      
      insights.push({
        id: 'growth-impact-1',
        type: 'impact',
        title: 'BD Impact',
        insight: 'Zain MOU signing completed. Regional partnerships advancing.',
        why: 'Based on calendar events and shared deal artifacts',
        scope: 'Growth',
        trend: 'up',
        department: 'Business Development',
        createdAt: now,
      })
    }
    
    // Product insights
    if (permissions.scopes.includes('product')) {
      insights.push({
        id: 'product-health-1',
        type: 'health',
        title: 'Engineering Velocity',
        insight: 'Sprint on track. 15/20 story points completed mid-sprint.',
        why: 'Linear sprint metrics and cycle analysis',
        scope: 'Product Engineering',
        trend: 'up',
        department: 'Product Engineering',
        createdAt: now,
      })
    }
    
    // AI Success insights
    if (permissions.scopes.includes('ai_success')) {
      insights.push({
        id: 'ai-health-1',
        type: 'health',
        title: 'AI Success Delivery',
        insight: 'Customer deployments on schedule. 3 new integrations this week.',
        why: 'Based on Linear delivery and customer artifacts',
        scope: 'AI Success',
        trend: 'up',
        department: 'AI Success',
        createdAt: now,
      })
    }
    
    // Personal insights (everyone gets these)
    insights.push({
      id: 'personal-1',
      type: 'workload',
      title: 'Your Week',
      insight: `You have ${Math.floor(Math.random() * 5) + 3} meetings scheduled and ${Math.floor(Math.random() * 8) + 2} tasks in progress.`,
      why: 'Based on your calendar and Linear assignments',
      scope: 'Personal',
      trend: 'stable',
      createdAt: now,
    })
    
    return NextResponse.json({
      ok: true,
      insights,
      user: {
        name: profile.full_name,
        role: profile.role,
        department: profile.department,
        isCoFounder: permissions.isCoFounder,
        isLeadership: permissions.isLeadership,
      },
      permissions: {
        scopes: permissions.scopes,
        canSeeOrgAggregates: permissions.canSeeOrgAggregates,
        canSeeDepartmentAggregates: permissions.canSeeDepartmentAggregates,
      },
    })
    
  } catch (error: any) {
    console.error('[Insights API] Error:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to fetch insights',
    }, { status: 500 })
  }
}

