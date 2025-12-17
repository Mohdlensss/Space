/**
 * AI Intelligence Core - Sentiment & Insights
 * 
 * SAFE MODE RULES:
 * 1. NEVER identify or label individuals
 * 2. Only provide AGGREGATED insights
 * 3. Focus on themes, not people
 * 4. Be constructive and actionable
 * 5. Never use negative labels for people
 * 
 * Permission hierarchy:
 * - Personal insights: visible only to the user
 * - Team insights: aggregated per team (managers only)
 * - Org insights: org-level only (leadership only)
 */

import type {
  UserContext,
  SentimentLevel,
  SentimentTrend,
  TeamInsight,
  PersonalInsight,
  OrgInsight
} from './types'
import { openai, AI_CONFIG, SYSTEM_PROMPTS, isAIEnabled } from './config'
import { retrieveDocuments } from './retrieval'
import { logAIAccess } from './permissions'

/**
 * Analyze sentiment of a text (returns score -1 to 1)
 * This is used ONLY for aggregation, never shown individually
 */
async function analyzeSentimentScore(text: string): Promise<number> {
  if (!isAIEnabled() || !openai) {
    return 0 // Neutral default
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.chatModel,
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of the text. Return ONLY a number between -1 (very negative) and 1 (very positive). No explanation.'
        },
        {
          role: 'user',
          content: text.slice(0, 1000)
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    })
    
    const score = parseFloat(response.choices[0]?.message?.content || '0')
    return Math.max(-1, Math.min(1, score)) // Clamp to [-1, 1]
  } catch {
    return 0
  }
}

/**
 * Convert score to sentiment level
 */
function scoreToLevel(score: number): SentimentLevel {
  if (score >= 0.5) return 'very_positive'
  if (score >= 0.2) return 'positive'
  if (score >= -0.2) return 'neutral'
  if (score >= -0.5) return 'negative'
  return 'very_negative'
}

/**
 * Get PERSONAL insights for a user
 * Only the user can see this
 */
export async function getPersonalInsights(
  userContext: UserContext,
  period: string = 'last_7_days'
): Promise<PersonalInsight> {
  // Retrieve only the user's own data
  const retrieval = await retrieveDocuments(
    'my recent messages and activities',
    {
      ...userContext,
      channelMemberships: [] // Only own data
    },
    { topK: 20 }
  )
  
  // Analyze personal sentiment from own messages
  let totalScore = 0
  let count = 0
  
  for (const chunk of retrieval.chunks) {
    if (chunk.ownerId === userContext.userId) {
      const score = await analyzeSentimentScore(chunk.content)
      totalScore += score
      count++
    }
  }
  
  const averageScore = count > 0 ? totalScore / count : 0
  
  // Generate insights using LLM (personal data only)
  const insights = await generatePersonalInsightsFromLLM(userContext, retrieval.chunks)
  
  await logAIAccess(userContext.userId, 'personal_insights', retrieval.chunks.map(c => c.id))
  
  return {
    userId: userContext.userId,
    period,
    myMoodTrend: {
      period,
      overallSentiment: scoreToLevel(averageScore),
      score: averageScore,
      trend: 'stable',
      sampleSize: count
    },
    myWorkloadEstimate: insights.workload,
    myTopPriorities: insights.priorities,
    myRecentAchievements: insights.achievements,
    suggestedFocus: insights.focus
  }
}

/**
 * Generate personal insights using LLM
 */
async function generatePersonalInsightsFromLLM(
  userContext: UserContext,
  chunks: { content: string; ownerId: string }[]
): Promise<{
  workload: 'balanced' | 'heavy' | 'light'
  priorities: string[]
  achievements: string[]
  focus: string[]
}> {
  if (!isAIEnabled() || !openai) {
    return {
      workload: 'balanced',
      priorities: ['Unable to analyze - AI not configured'],
      achievements: [],
      focus: []
    }
  }
  
  const ownContent = chunks
    .filter(c => c.ownerId === userContext.userId)
    .map(c => c.content)
    .join('\n\n')
  
  if (!ownContent) {
    return {
      workload: 'balanced',
      priorities: ['No recent activity found'],
      achievements: [],
      focus: ['Start by checking your tasks and messages']
    }
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.chatModel,
      messages: [
        {
          role: 'system',
          content: `Analyze this user's recent activity and provide insights.
Return JSON in this exact format:
{
  "workload": "balanced" | "heavy" | "light",
  "priorities": ["priority 1", "priority 2", "priority 3"],
  "achievements": ["achievement 1"],
  "focus": ["suggestion 1", "suggestion 2"]
}
Be concise. Maximum 3 items per array.`
        },
        {
          role: 'user',
          content: `My recent activity:\n${ownContent.slice(0, 3000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''))
    
    return {
      workload: parsed.workload || 'balanced',
      priorities: parsed.priorities || [],
      achievements: parsed.achievements || [],
      focus: parsed.focus || []
    }
  } catch (error) {
    console.error('Failed to generate personal insights:', error)
    return {
      workload: 'balanced',
      priorities: [],
      achievements: [],
      focus: []
    }
  }
}

/**
 * Get TEAM insights (aggregated)
 * Only managers can see this, and NEVER individual data
 */
export async function getTeamInsights(
  userContext: UserContext,
  teamId: string,
  period: string = 'last_7_days'
): Promise<TeamInsight | null> {
  // Only managers can see team insights
  if (!userContext.isManager && !userContext.isLeadership) {
    return null
  }
  
  // Get team channel messages (aggregated)
  const retrieval = await retrieveDocuments(
    'team discussions and updates',
    userContext,
    { topK: 50 }
  )
  
  // Aggregate sentiment (never per-individual)
  let totalScore = 0
  let count = 0
  
  for (const chunk of retrieval.chunks) {
    const score = await analyzeSentimentScore(chunk.content)
    totalScore += score
    count++
  }
  
  const averageScore = count > 0 ? totalScore / count : 0
  
  // Generate AGGREGATED themes (no names)
  const themes = await extractThemes(retrieval.chunks.map(c => c.content))
  
  await logAIAccess(userContext.userId, 'team_insights', [teamId])
  
  return {
    teamId,
    teamName: 'Team', // Would come from org chart
    period,
    moodTrend: {
      period,
      overallSentiment: scoreToLevel(averageScore),
      score: averageScore,
      trend: 'stable',
      sampleSize: count
    },
    collaborationHealth: Math.round((averageScore + 1) * 50), // Convert to 0-100
    workloadIndicator: count > 30 ? 'heavy' : count > 10 ? 'balanced' : 'light',
    frictionSignals: themes.friction
  }
}

/**
 * Get ORG insights (leadership only)
 * Only aggregated, high-level insights
 */
export async function getOrgInsights(
  userContext: UserContext,
  period: string = 'last_7_days'
): Promise<OrgInsight | null> {
  // Only leadership can see org insights
  if (!userContext.isLeadership) {
    return null
  }
  
  // Get org-wide public data (announcements, public channels)
  const retrieval = await retrieveDocuments(
    'organization updates and announcements',
    userContext,
    { topK: 100, sources: ['announcement', 'chat_message'] }
  )
  
  // Aggregate sentiment
  let totalScore = 0
  let count = 0
  
  for (const chunk of retrieval.chunks) {
    const score = await analyzeSentimentScore(chunk.content)
    totalScore += score
    count++
  }
  
  const averageScore = count > 0 ? totalScore / count : 0
  
  // Extract org-wide themes (no attribution)
  const themes = await extractThemes(retrieval.chunks.map(c => c.content))
  
  await logAIAccess(userContext.userId, 'org_insights', ['org-wide'])
  
  return {
    period,
    overallMorale: {
      period,
      overallSentiment: scoreToLevel(averageScore),
      score: averageScore,
      trend: 'stable',
      sampleSize: count
    },
    crossTeamCollaboration: Math.round((averageScore + 1) * 50),
    topOrgThemes: themes.topics,
    alertIndicators: themes.friction
  }
}

/**
 * Extract themes from content (no individual attribution)
 */
async function extractThemes(
  contents: string[]
): Promise<{ topics: string[]; friction: string[] }> {
  if (!isAIEnabled() || !openai || contents.length === 0) {
    return { topics: [], friction: [] }
  }
  
  const aggregatedContent = contents.join('\n\n').slice(0, 5000)
  
  try {
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.chatModel,
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPTS.sentiment}

Analyze the aggregated content and extract themes.
Return JSON in this exact format:
{
  "topics": ["topic 1", "topic 2", "topic 3"],
  "friction": ["potential friction point 1"]
}
NEVER mention individual names or identify people.
Focus on THEMES and TOPICS only.
Maximum 3 topics, maximum 2 friction points.`
        },
        {
          role: 'user',
          content: `Aggregated team content:\n${aggregatedContent}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''))
    
    return {
      topics: parsed.topics || [],
      friction: parsed.friction || []
    }
  } catch (error) {
    console.error('Failed to extract themes:', error)
    return { topics: [], friction: [] }
  }
}

