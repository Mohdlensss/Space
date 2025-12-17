/**
 * Approval Action API
 * PATCH /api/approvals/[id] - Approve or reject a request
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { canApprove, getTeamMember } from '@/lib/approvals/hierarchy'

// This would be imported from the main route in production
// For now, we'll use a shared reference

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // In production, this would update the database
    // For now, return success
    const member = getTeamMember(user.email)

    return NextResponse.json({
      ok: true,
      message: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      decidedBy: member?.name || user.email,
      decidedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Approval Action] Error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}

