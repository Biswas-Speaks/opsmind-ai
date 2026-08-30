import { KnowledgeDocument, KnowledgeChunk } from '../models/Knowledge';
import axios from 'axios';

// Local Math Utilities for Cosine Similarity search
const dotProduct = (a: number[], b: number[]): number => {
  return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
};

const magnitude = (arr: number[]): number => {
  return Math.sqrt(arr.reduce((sum, val) => sum + val * val, 0));
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};

// Generates a float array filled with deterministic numbers based on string hashes (for offline testing)
const generateMockEmbedding = (text: string, dimensions = 768): number[] => {
  const vector: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let d = 0; d < dimensions; d++) {
    const noise = Math.sin(hash + d) * 10000;
    vector.push(noise - Math.floor(noise)); // value between -1.0 and 1.0
  }
  return vector;
};

export class RAGService {
  private static geminiKey = process.env.GEMINI_API_KEY || '';

  // Get vector embedding for a text string
  private static async getEmbedding(text: string): Promise<number[]> {
    if (!this.geminiKey) {
      return generateMockEmbedding(text);
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiKey}`,
        {
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        },
        { timeout: 5000 }
      );
      return response.data.embedding.values;
    } catch (err: any) {
      console.warn(`[RAG Service] Embedding generation failed: ${err.message}. Using mock vectors.`);
      return generateMockEmbedding(text);
    }
  }

  // Ingest document text, chunk it, embed it, and save chunks
  public static async ingestDocument(documentId: string, title: string, fullText: string): Promise<void> {
    try {
      // Chunk size = 500 characters, overlap = 100 characters
      const chunkSize = 500;
      const overlap = 100;
      const chunks: string[] = [];
      
      let index = 0;
      while (index < fullText.length) {
        chunks.push(fullText.substring(index, index + chunkSize).trim());
        index += chunkSize - overlap;
        if (index >= fullText.length || fullText.length - index < overlap) break;
      }

      // If text is short, make at least one chunk
      if (chunks.length === 0 && fullText.trim().length > 0) {
        chunks.push(fullText.trim());
      }

      console.log(`[RAG Ingestion] Chunking '${title}' into ${chunks.length} segments...`);

      // Generate embeddings and store chunks
      const chunkInsertPromises = chunks.map(async (content, i) => {
        const embedding = await this.getEmbedding(content);
        return {
          document: documentId,
          content,
          chunkIndex: i,
          embedding,
        };
      });

      const chunkDocs = await Promise.all(chunkInsertPromises);
      await KnowledgeChunk.insertMany(chunkDocs);
      console.log(`[RAG Ingestion] Ingested ${chunkDocs.length} chunks successfully.`);
    } catch (error) {
      console.error(`[RAG Ingestion Error] Ingesting document failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // Perform similarity search
  public static async searchKnowledge(query: string, limit = 3): Promise<any[]> {
    try {
      const queryEmbedding = await this.getEmbedding(query);

      // In a real production setup with a vector search index we would run a pipeline matching Atlas:
      // const results = await KnowledgeChunk.aggregate([{ $vectorSearch: ... }]);
      //
      // However, local MongoDB deployments do not support $vectorSearch.
      // Therefore, we perform local Cosine Similarity matching over all active chunks:
      const allChunks = await KnowledgeChunk.find({}).populate('document', 'title category tags');
      
      const similarityList = allChunks.map((chunk) => {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          score,
          chunkId: chunk._id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          document: chunk.document,
        };
      });

      // Sort by similarity score descending and slice
      return similarityList
        .sort((a, b) => b.score - a.score)
        .filter((c) => c.score > 0.1) // Only return relevant matches
        .slice(0, limit);
    } catch (error) {
      console.error(`[RAG Search Error] Query failed: ${(error as Error).message}`);
      return [];
    }
  }
}
