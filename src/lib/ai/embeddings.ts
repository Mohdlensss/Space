/**
 * AI Intelligence Core - Embeddings
 * 
 * Generate and manage text embeddings for semantic search.
 * Used for RAG retrieval.
 */

import { openai, AI_CONFIG, isAIEnabled } from './config'

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!isAIEnabled() || !openai) {
    console.warn('AI not enabled - cannot generate embedding')
    return null
  }
  
  try {
    const response = await openai.embeddings.create({
      model: AI_CONFIG.embeddingModel,
      input: text.slice(0, 8000), // Limit input size
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    return null
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  if (!isAIEnabled() || !openai) {
    console.warn('AI not enabled - cannot generate embeddings')
    return texts.map(() => null)
  }
  
  // Process in batches of 100 (OpenAI limit)
  const batchSize = 100
  const results: (number[] | null)[] = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => t.slice(0, 8000))
    
    try {
      const response = await openai.embeddings.create({
        model: AI_CONFIG.embeddingModel,
        input: batch,
      })
      
      for (const item of response.data) {
        results.push(item.embedding)
      }
    } catch (error) {
      console.error('Failed to generate embeddings batch:', error)
      // Fill with nulls for failed batch
      for (let j = 0; j < batch.length; j++) {
        results.push(null)
      }
    }
  }
  
  return results
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (normA * normB)
}

/**
 * Find most similar documents using embeddings
 */
export function findMostSimilar(
  queryEmbedding: number[],
  documents: { id: string; embedding: number[] }[],
  topK: number = AI_CONFIG.topK,
  threshold: number = AI_CONFIG.similarityThreshold
): { id: string; similarity: number }[] {
  const similarities = documents.map(doc => ({
    id: doc.id,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }))
  
  return similarities
    .filter(s => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
}

/**
 * Chunk text for embedding
 * Splits long text into overlapping chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
  }
  
  return chunks
}

