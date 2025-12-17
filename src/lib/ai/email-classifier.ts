/**
 * AI Email Classifier - DOO-Specific Intelligence
 * 
 * CRITICAL = Requires immediate attention from DOO team
 * - FROM DOO team members (@doo.ooo sender)
 * - Multiple DOO team members in thread (collaboration)
 * - Actual customer/partner communications (not promotional)
 * 
 * NOT CRITICAL = Promotional, auto-replies, newsletters, service notifications
 */

export type EmailPriority = 'critical' | 'important' | 'normal' | 'low' | 'filtered'

export interface ClassifiedEmail {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  threadId: string
  priority: EmailPriority
  priorityReason: string
  category: string
  cc?: string
  to?: string
}

interface EmailInput {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  threadId: string
  cc?: string
  to?: string
}

// DOO Team domain
const DOO_DOMAIN = '@doo.ooo'

// Known DOO customers/partners (add real customers here)
const KNOWN_CUSTOMERS = [
  'zain', 'batelco', 'stc', 'viva', 'alsalam', 'benefit', 'tamkeen',
  'ewa', 'mumtalakat', 'investcorp', 'hamsa', 'servable'
]

// Known service/promotional senders (these are NOT customers)
const PROMOTIONAL_SENDERS = [
  // Dev tools & services
  'twilio', 'namecheap', 'godaddy', 'cloudflare', 'vercel', 
  'netlify', 'stripe', 'github', 'gitlab', 'notion', 'slack',
  'figma', 'linear', 'asana', 'monday', 'jira', 'confluence',
  'dropbox', 'google', 'microsoft', 'amazon', 'aws', 'azure',
  'supabase', 'firebase', 'heroku', 'digitalocean', 'linode',
  'openai', 'anthropic', 'synthesia', 'loom', 'zoom', 'calendly',
  'hubspot', 'intercom', 'zendesk', 'mailchimp', 'sendgrid',
  'clickup', 'basecamp', 'trello', 'airtable', 'coda',
  // Generic patterns
  'newsletter', 'noreply', 'no-reply', 'donotreply', 'notifications',
  'marketing', 'updates@', 'news@', 'info@', 'hello@', 'team@',
  'support@', 'billing@', 'promo', 'digest', 'weekly', 'daily',
  // Sales/spam patterns
  'sales', 'deal', 'offer', 'discount', 'leads', 'outreach',
  'cold email', 'bdr', 'sdr', 'prospecting'
]

const PROMOTIONAL_KEYWORDS = [
  // Unsubscribe/newsletter
  'unsubscribe', 'opt out', 'opt-out', 'preferences', 'notification settings',
  'view in browser', 'email preferences', 'manage subscription',
  'newsletter', 'weekly digest', 'monthly recap', 'product update',
  // Marketing speak
  'new feature', 'check out', 'don\'t miss', 'last chance',
  'limited time', 'special offer', 'discount', 'promo code',
  'webinar', 'register now', 'we\'re excited', 'introducing',
  // Auto-generated
  'automatic reply', 'auto-reply', 'out of office', 'on leave',
  'contact import', 'import completed', 'sync completed',
  'your invoice', 'receipt', 'payment confirmation', 'order confirmation',
  'security alert', 'sign-in', 'login', 'verify your', 'confirm your',
  'new sign-in', 'new device', 'password reset', 'two-factor',
  // Promotional patterns
  'bells & whistles', 'bells and whistles', 'product news',
  'see what\'s new', 'whats new', 'announcement',
  'ceo message', 'message from ceo', 'from our ceo', 'from the ceo',
  'year in review', 'wrapped', 'end of year', 'looking back',
  'prize', 'giveaway', 'win an', 'draw', 'lottery', 'contest',
  'gift', 'special gift', 'free', 'complimentary',
  // Cold outreach / sales
  'accelerate your', 'consolidate', 'tool overload', 'streamline',
  'help you', 'curious to ask', 'following up', 'checking in',
  'quick question', 'brief call', '15 min', 'demo', 'schedule a',
  'outsourcing', 'offshore', 'nearshore', 'hiring needs',
  'best customer success', 'best software', 'award winning',
  'final call', 'last call', 'closing the'
]

const AUTO_REPLY_PATTERNS = [
  'automatic reply', 'auto reply', 'auto-reply', 'autoreply',
  'out of office', 'ooo:', 'ooo -', '[ooo]', 'out of the office',
  'away from', 'on vacation', 'on leave', 'currently unavailable',
  'i am away', 'i\'m away', 'will respond', 'limited access'
]

/**
 * Check if email is FROM DOO team (not just TO)
 */
function isFromDOOTeam(from: string): boolean {
  const email = extractEmail(from)
  return email.includes(DOO_DOMAIN)
}

/**
 * Check if multiple DOO team members are in the thread (real collaboration)
 */
function hasMultipleDOOMembers(from: string, cc: string = '', to: string = ''): boolean {
  const combined = `${from} ${cc} ${to}`.toLowerCase()
  const matches = combined.match(/@doo\.ooo/g)
  // Need at least 2 DOO addresses (sender + another, or 2 in CC)
  return matches !== null && matches.length >= 2
}

/**
 * Check if from a known customer/partner
 */
function isFromKnownCustomer(from: string, subject: string): boolean {
  const fromLower = from.toLowerCase()
  const subjectLower = subject.toLowerCase()
  
  // First make sure it's not promotional
  if (isPromotionalSender(fromLower)) return false
  
  for (const customer of KNOWN_CUSTOMERS) {
    if (fromLower.includes(customer) || subjectLower.includes(customer)) {
      return true
    }
  }
  return false
}

/**
 * Extract email address from "Name <email>" format
 */
function extractEmail(from: string): string {
  const match = from.match(/<(.+?)>/)
  return match ? match[1].toLowerCase() : from.toLowerCase()
}

/**
 * Check if sender is a known promotional/service sender
 * Only check the actual email address, not the display name
 */
function isPromotionalSender(from: string): boolean {
  const email = extractEmail(from)
  
  // Never filter DOO team emails
  if (email.includes(DOO_DOMAIN)) return false
  
  // Check if email domain/address matches promotional patterns
  return PROMOTIONAL_SENDERS.some(pattern => email.includes(pattern))
}

/**
 * Check if this is promotional content
 */
function isPromotionalContent(subject: string, snippet: string): boolean {
  const textLower = `${subject} ${snippet}`.toLowerCase()
  return PROMOTIONAL_KEYWORDS.some(keyword => textLower.includes(keyword))
}

/**
 * Check if this is an auto-reply
 */
function isAutoReply(subject: string, snippet: string): boolean {
  const textLower = `${subject} ${snippet}`.toLowerCase()
  return AUTO_REPLY_PATTERNS.some(pattern => textLower.includes(pattern))
}

/**
 * Main classification function
 */
export function classifyEmail(email: EmailInput): ClassifiedEmail {
  const { from, subject, snippet, cc, to } = email
  
  // STEP 1: ALWAYS check DOO team first - highest priority
  if (isFromDOOTeam(from)) {
    return {
      ...email,
      priority: 'critical',
      priorityReason: 'From DOO team member',
      category: 'Team',
    }
  }
  
  // STEP 2: Filter auto-replies (always low priority)
  if (isAutoReply(subject, snippet)) {
    return {
      ...email,
      priority: 'low',
      priorityReason: 'Auto-reply or out of office',
      category: 'Auto-reply',
    }
  }
  
  // STEP 3: Check if sender is a known promotional/service company
  if (isPromotionalSender(from)) {
    return {
      ...email,
      priority: 'low',
      priorityReason: 'Service notification or newsletter',
      category: 'Service',
    }
  }
  
  // STEP 4: Check if content is promotional (cold outreach, marketing, etc.)
  if (isPromotionalContent(subject, snippet)) {
    return {
      ...email,
      priority: 'low',
      priorityReason: 'Marketing or promotional content',
      category: 'Promotional',
    }
  }
  
  // STEP 5: CRITICAL - Multiple DOO team members in thread
  if (hasMultipleDOOMembers(from, cc, to)) {
    return {
      ...email,
      priority: 'critical',
      priorityReason: 'DOO team collaboration',
      category: 'Team',
    }
  }
  
  // STEP 6: CRITICAL - Known customer/partner
  if (isFromKnownCustomer(from, subject)) {
    return {
      ...email,
      priority: 'critical',
      priorityReason: 'From known customer or partner',
      category: 'Customer',
    }
  }
  
  // STEP 7: Check for genuinely important keywords (not promotional)
  const importantKeywords = ['urgent', 'asap', 'emergency', 'critical issue', 'down', 'outage', 'incident']
  const textLower = `${subject} ${snippet}`.toLowerCase()
  if (importantKeywords.some(k => textLower.includes(k))) {
    return {
      ...email,
      priority: 'important',
      priorityReason: 'Contains urgent keywords',
      category: 'Urgent',
    }
  }
  
  // STEP 8: Default to normal for everything else
  return {
    ...email,
    priority: 'normal',
    priorityReason: 'Regular email',
    category: 'General',
  }
}

/**
 * Batch classify multiple emails
 */
export function classifyEmails(emails: EmailInput[]): ClassifiedEmail[] {
  return emails.map(classifyEmail)
}

/**
 * Get summary stats for classified emails
 */
export function getEmailStats(emails: ClassifiedEmail[]) {
  return {
    total: emails.length,
    critical: emails.filter(e => e.priority === 'critical').length,
    important: emails.filter(e => e.priority === 'important').length,
    normal: emails.filter(e => e.priority === 'normal').length,
    low: emails.filter(e => e.priority === 'low').length,
    filtered: emails.filter(e => e.priority === 'filtered').length,
  }
}

/**
 * Filter and sort emails by priority
 */
export function getFilteredAndSortedEmails(emails: ClassifiedEmail[], excludeFiltered = true) {
  let filtered = emails
  
  if (excludeFiltered) {
    filtered = emails.filter(e => e.priority !== 'filtered')
  }
  
  // Sort by priority (critical first)
  const priorityOrder: Record<EmailPriority, number> = {
    critical: 0,
    important: 1,
    normal: 2,
    low: 3,
    filtered: 4,
  }
  
  return filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}
