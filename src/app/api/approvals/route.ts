/**
 * Approvals API
 * GET /api/approvals - Get pending approvals for current user
 * POST /api/approvals - Create a new approval request
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getApproversForUser, canApprove, getTeamMember } from '@/lib/approvals/hierarchy'

export interface ApprovalRequest {
  id: string
  type: 'remote_work' | 'leave' | 'expense' | 'other'
  requester_email: string
  requester_name: string
  approver_emails: string[]
  status: 'pending' | 'approved' | 'rejected'
  title: string
  description: string
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  decided_by?: string
  decided_at?: string
}

// In-memory store for now (would be in Supabase in production)
const approvalStore: ApprovalRequest[] = [
  // Sample data for testing
  {
    id: 'approval-1',
    type: 'remote_work',
    requester_email: 'eyad@doo.ooo',
    requester_name: 'Eyad Ahmed',
    approver_emails: ['ali@doo.ooo'],
    status: 'pending',
    title: 'Remote Work Request',
    description: 'Working from home for client meeting prep',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'approval-2',
    type: 'leave',
    requester_email: 'qabas@doo.ooo',
    requester_name: 'Qabas Al Hasni',
    approver_emails: ['mohamed@doo.ooo'],
    status: 'pending',
    title: 'Annual Leave Request',
    description: 'Family vacation - 3 days',
    start_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'approval-3',
    type: 'remote_work',
    requester_email: 'ghazwan@doo.ooo',
    requester_name: 'Mohammed Ghazwan',
    approver_emails: ['hh@doo.ooo', 'at@doo.ooo'],
    status: 'pending',
    title: 'Remote Work Request',
    description: 'Client visit in Riyadh - working remotely',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userEmail = user.email.toLowerCase()

    // Get approvals where user is an approver
    const pendingForMe = approvalStore.filter(
      a => a.status === 'pending' && 
           a.approver_emails.some(e => e.toLowerCase() === userEmail)
    )

    // Get user's own requests
    const myRequests = approvalStore.filter(
      a => a.requester_email.toLowerCase() === userEmail
    )

    return NextResponse.json({
      ok: true,
      pendingForMe,
      myRequests,
      counts: {
        pendingToApprove: pendingForMe.length,
        myPending: myRequests.filter(r => r.status === 'pending').length,
        myApproved: myRequests.filter(r => r.status === 'approved').length,
        myRejected: myRequests.filter(r => r.status === 'rejected').length,
      }
    })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, description, start_date, end_date } = body

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title required' }, { status: 400 })
    }

    const member = getTeamMember(user.email)
    const approvers = getApproversForUser(user.email)

    if (approvers.length === 0) {
      return NextResponse.json({ 
        error: 'No approvers found for your role. Contact HR.' 
      }, { status: 400 })
    }

    const newRequest: ApprovalRequest = {
      id: `approval-${Date.now()}`,
      type,
      requester_email: user.email,
      requester_name: member?.name || user.email,
      approver_emails: approvers,
      status: 'pending',
      title,
      description: description || '',
      start_date,
      end_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    approvalStore.push(newRequest)

    return NextResponse.json({
      ok: true,
      request: newRequest,
      approvers: approvers.map(e => getTeamMember(e)?.name || e),
    })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}

