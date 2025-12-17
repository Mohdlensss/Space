/**
 * DOO Role-Based Access Control
 * 
 * This is the single source of truth for who can see what.
 * Permissions are enforced SERVER-SIDE before any data reaches the client.
 */

export type AnalyticsScope = 'org' | 'operations' | 'growth' | 'bd' | 'product' | 'ai_success' | 'finance' | 'legal' | 'personal'

export interface RolePermissions {
  scopes: AnalyticsScope[]
  canSeeOrgAggregates: boolean
  canSeeDepartmentAggregates: boolean
  canSeeTeamDetails: boolean
  canSeeImpactCards: boolean
  departments: string[]
  isCoFounder: boolean
  isLeadership: boolean
}

/**
 * Role to permissions mapping
 * This is explicit and exhaustive - no inference
 */
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  // Co-Founders - Full org visibility
  'CEO & Co-Founder': {
    scopes: ['org', 'operations', 'growth', 'bd', 'product', 'ai_success'],
    canSeeOrgAggregates: true,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['*'], // All departments
    isCoFounder: true,
    isLeadership: true,
  },
  'COO & Co-Founder': {
    scopes: ['org', 'operations', 'growth', 'bd', 'product', 'ai_success', 'finance', 'legal'],
    canSeeOrgAggregates: true,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['*'], // All departments
    isCoFounder: true,
    isLeadership: true,
  },

  // C-Level Leadership
  'Chief Growth Officer': {
    scopes: ['growth', 'bd'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['Business Development', 'Marketing', 'Growth'],
    isCoFounder: false,
    isLeadership: true,
  },

  // VP Level
  'VP of Digital Growth': {
    scopes: ['growth'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['Marketing', 'Growth'],
    isCoFounder: false,
    isLeadership: true,
  },

  // Directors
  'Regional Director of Business Development': {
    scopes: ['bd'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['Business Development'],
    isCoFounder: false,
    isLeadership: true,
  },

  // Leads
  'Product Engineering Lead': {
    scopes: ['product'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['Product Engineering'],
    isCoFounder: false,
    isLeadership: false,
  },
  'AI Success Lead': {
    scopes: ['ai_success'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['AI Success'],
    isCoFounder: false,
    isLeadership: false,
  },
  'Business Development Lead': {
    scopes: ['bd'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: true,
    canSeeImpactCards: true,
    departments: ['Business Development'],
    isCoFounder: false,
    isLeadership: false,
  },

  // Operations Staff
  'Finance Analyst': {
    scopes: ['finance', 'operations'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: false,
    canSeeImpactCards: false,
    departments: ['Operations', 'Finance'],
    isCoFounder: false,
    isLeadership: false,
  },
  'Legal & Compliance Officer': {
    scopes: ['legal', 'operations'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: true,
    canSeeTeamDetails: false,
    canSeeImpactCards: false,
    departments: ['Operations', 'Legal'],
    isCoFounder: false,
    isLeadership: false,
  },

  // Default for all other roles
  _default: {
    scopes: ['personal'],
    canSeeOrgAggregates: false,
    canSeeDepartmentAggregates: false,
    canSeeTeamDetails: false,
    canSeeImpactCards: false,
    departments: [],
    isCoFounder: false,
    isLeadership: false,
  },
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: string): RolePermissions {
  // Check for exact match first
  if (ROLE_PERMISSIONS[role]) {
    return ROLE_PERMISSIONS[role]
  }
  
  // Check for partial matches (e.g., "Senior Product Engineer" → default)
  const roleLower = role.toLowerCase()
  
  if (roleLower.includes('ceo') || roleLower.includes('coo')) {
    return ROLE_PERMISSIONS['CEO & Co-Founder']
  }
  
  if (roleLower.includes('chief growth')) {
    return ROLE_PERMISSIONS['Chief Growth Officer']
  }
  
  if (roleLower.includes('vp') || roleLower.includes('vice president')) {
    return ROLE_PERMISSIONS['VP of Digital Growth']
  }
  
  if (roleLower.includes('director') && roleLower.includes('business')) {
    return ROLE_PERMISSIONS['Regional Director of Business Development']
  }
  
  if (roleLower.includes('lead') && roleLower.includes('product')) {
    return ROLE_PERMISSIONS['Product Engineering Lead']
  }
  
  if (roleLower.includes('finance')) {
    return ROLE_PERMISSIONS['Finance Analyst']
  }
  
  if (roleLower.includes('legal')) {
    return ROLE_PERMISSIONS['Legal & Compliance Officer']
  }
  
  return ROLE_PERMISSIONS['_default']
}

/**
 * Check if a user can access a specific analytics scope
 */
export function canAccessScope(role: string, scope: AnalyticsScope): boolean {
  const permissions = getPermissionsForRole(role)
  return permissions.scopes.includes(scope) || permissions.scopes.includes('org')
}

/**
 * Check if a user can see a specific department's data
 */
export function canAccessDepartment(role: string, department: string): boolean {
  const permissions = getPermissionsForRole(role)
  return permissions.departments.includes('*') || permissions.departments.includes(department)
}

/**
 * Get all scopes a user can access
 */
export function getAccessibleScopes(role: string): AnalyticsScope[] {
  return getPermissionsForRole(role).scopes
}

