/**
 * DOO HR Policy Download API
 * 
 * GET /api/doo/hr-policy
 * Returns the official DOO HR Policy as downloadable markdown
 */

import { NextResponse } from 'next/server'
import { getDownloadablePolicy } from '@/lib/ai/doo-knowledge'

export async function GET() {
  const policy = getDownloadablePolicy()
  
  return new NextResponse(policy, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="DOO-HR-Policy-2025.md"',
    },
  })
}

