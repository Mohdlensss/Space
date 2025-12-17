/**
 * DOO Approval Hierarchy
 * 
 * This defines who approves what based on reporting lines.
 * LOCKED - Do not modify without leadership approval.
 */

export interface TeamMember {
  email: string
  name: string
  role: string
  department: string
  reportsTo: string | null // email of manager, null for CEO
  canApproveFor?: string[] // additional approval authority (emails)
}

// Complete DOO team hierarchy
export const DOO_TEAM: TeamMember[] = [
  // Leadership - Co-Founders
  {
    email: 'ali@doo.ooo',
    name: 'Ali Mohsen',
    role: 'CEO & Co-Founder',
    department: 'Leadership',
    reportsTo: null, // CEO reports to board (C-Suite approves)
    canApproveFor: ['*'], // Can approve anyone
  },
  {
    email: 'mohamed@doo.ooo',
    name: 'Mohamed Alkhabbaz',
    role: 'COO & Co-Founder',
    department: 'Leadership',
    reportsTo: null, // COO reports to CEO/Board (CEO approves, or C-Suite for leave)
    canApproveFor: ['*'], // Can approve anyone except CEO
  },
  {
    email: 'hh@doo.ooo',
    name: 'Hussain Haji',
    role: 'Chief Growth Officer',
    department: 'Leadership',
    reportsTo: 'ali@doo.ooo', // CEO + COO approve
    canApproveFor: [], // Growth team handled via normal reporting
  },

  // VP Level
  {
    email: 'hesham@doo.ooo',
    name: 'Hesham Alshoala',
    role: 'VP of Digital Growth',
    department: 'Growth',
    reportsTo: 'hh@doo.ooo',
  },

  // Directors
  {
    email: 'at@doo.ooo',
    name: 'Ali AlToblani',
    role: 'Regional Director of Business Development',
    department: 'Business Development',
    reportsTo: 'hh@doo.ooo',
    canApproveFor: [], // BD team reports to both AT and HH
  },

  // Operations (Report to COO)
  {
    email: 'nawaf@doo.ooo',
    name: 'Nawaf Haffadh',
    role: 'Finance Analyst',
    department: 'Operations',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'faisal@doo.ooo',
    name: 'Faisal Khamdan',
    role: 'Legal & Compliance Officer',
    department: 'Operations',
    reportsTo: 'mohamed@doo.ooo',
  },

  // Product Engineering (Report to CEO)
  {
    email: 'yusuf@doo.ooo',
    name: 'Yusuf Alhamad',
    role: 'Product Engineering Lead',
    department: 'Product Engineering',
    reportsTo: 'ali@doo.ooo',
  },
  {
    email: 'eyad@doo.ooo',
    name: 'Eyad Ahmed',
    role: 'Senior Product Engineer',
    department: 'Product Engineering',
    reportsTo: 'ali@doo.ooo',
  },
  {
    email: 'ali.h@doo.ooo',
    name: 'Ali Ali',
    role: 'Product Engineer',
    department: 'Product Engineering',
    reportsTo: 'ali@doo.ooo',
  },
  {
    email: 'naser@doo.ooo',
    name: 'Naser Almeel',
    role: 'Product Engineer',
    department: 'Product Engineering',
    reportsTo: 'ali@doo.ooo',
  },
  {
    email: 'hadeel@doo.ooo',
    name: 'Hadeel Rafea',
    role: 'Product Engineer',
    department: 'Product Engineering',
    reportsTo: 'ali@doo.ooo',
  },

  // AI Success (Report to COO)
  {
    email: 'ahmedh@doo.ooo',
    name: 'Ahmed Haffadh',
    role: 'AI Success Lead',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'qabas@doo.ooo',
    name: 'Qabas Al Hasni',
    role: 'AI Success Engineer',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'alsabbagh@doo.ooo',
    name: 'Ahmed Alsabbagh',
    role: 'AI Success Officer',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'a.a@doo.ooo',
    name: 'Ahmed Aldakheel',
    role: 'AI Success Officer',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'ahmeda@doo.ooo',
    name: 'Ahmed Alhamad',
    role: 'Technical Consultant',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },
  {
    email: 'zainab@doo.ooo',
    name: 'Zainab',
    role: 'AI Success & Operations',
    department: 'AI Success',
    reportsTo: 'mohamed@doo.ooo',
  },

  // Business Development (Report to CGO, BD Director can also approve)
  {
    email: 'ghazwan@doo.ooo',
    name: 'Mohammed Ghazwan',
    role: 'Business Development Lead',
    department: 'Business Development',
    reportsTo: 'hh@doo.ooo', // CGO
  },
  {
    email: 'mustafa@doo.ooo',
    name: 'Mustafa Hesham',
    role: 'Business Development Officer',
    department: 'Business Development',
    reportsTo: 'hh@doo.ooo',
  },
  {
    email: 'mohammed.alnoaimi@doo.ooo',
    name: 'Mohammed Alnoaimi',
    role: 'Delivery Integration Lead',
    department: 'Business Development',
    reportsTo: 'mohamed@doo.ooo', // Reports to COO for approvals
  },
  {
    email: 'mahmood@doo.ooo',
    name: 'Mahmood AlHubaish',
    role: 'Business Development Lead',
    department: 'Business Development',
    reportsTo: 'hh@doo.ooo',
  },

  // Marketing
  {
    email: 'noor@doo.ooo',
    name: 'Noor Ali',
    role: 'Marketing Officer',
    department: 'Marketing',
    reportsTo: 'hh@doo.ooo',
  },

  // New additions (placeholders)
  {
    email: 'salman@doo.ooo',
    name: 'Salman',
    role: 'Strategy & Operations',
    department: 'Operations',
    reportsTo: 'mohamed@doo.ooo',
  },
  
  // HR (future - not active yet)
  {
    email: 'rawan@doo.ooo',
    name: 'Rawan',
    role: 'HR Manager',
    department: 'Operations',
    reportsTo: 'mohamed@doo.ooo',
  },
]

/**
 * Get team member by email
 */
export function getTeamMember(email: string): TeamMember | undefined {
  return DOO_TEAM.find(m => m.email.toLowerCase() === email.toLowerCase())
}

/**
 * Get approvers for a given requester
 * Returns list of emails who can approve their requests
 */
export function getApproversForUser(requesterEmail: string): string[] {
  const member = getTeamMember(requesterEmail)
  if (!member) return []
  
  const approvers: string[] = []
  
  // Direct manager is always an approver
  if (member.reportsTo) {
    approvers.push(member.reportsTo)
  }
  
  // Special BD case: Both AT and HH can approve BD team
  if (member.department === 'Business Development' && member.email !== 'at@doo.ooo' && member.email !== 'hh@doo.ooo') {
    if (!approvers.includes('at@doo.ooo')) approvers.push('at@doo.ooo')
    if (!approvers.includes('hh@doo.ooo')) approvers.push('hh@doo.ooo')
  }
  
  // C-Suite leave: CEO + COO approve each other
  if (member.role.includes('CEO')) {
    approvers.push('mohamed@doo.ooo') // COO
    approvers.push('hh@doo.ooo') // CGO as witness
  }
  if (member.role.includes('COO')) {
    approvers.push('ali@doo.ooo') // CEO
  }
  if (member.role.includes('CGO')) {
    approvers.push('ali@doo.ooo') // CEO
    approvers.push('mohamed@doo.ooo') // COO
  }
  
  // COO can approve almost anyone (fallback)
  if (!approvers.includes('mohamed@doo.ooo') && member.email !== 'mohamed@doo.ooo' && member.email !== 'ali@doo.ooo') {
    approvers.push('mohamed@doo.ooo')
  }
  
  return [...new Set(approvers)] // Dedupe
}

/**
 * Check if approver can approve for requester
 */
export function canApprove(approverEmail: string, requesterEmail: string): boolean {
  const approvers = getApproversForUser(requesterEmail)
  return approvers.some(a => a.toLowerCase() === approverEmail.toLowerCase())
}

/**
 * Get all pending approvals for an approver
 */
export function getDirectReports(managerEmail: string): TeamMember[] {
  return DOO_TEAM.filter(m => m.reportsTo?.toLowerCase() === managerEmail.toLowerCase())
}

/**
 * Get all team members an approver can approve for
 */
export function getApprovableUsers(approverEmail: string): TeamMember[] {
  return DOO_TEAM.filter(m => canApprove(approverEmail, m.email))
}

