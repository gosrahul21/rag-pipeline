import { Pinecone } from '@pinecone-database/pinecone';

interface Chunk {
  id: string;
  text: string;
  metadata: Record<string, string>
}

export class PineconeService {
  private pc: Pinecone;
  private indexName: string;
  private modelName: string;

  constructor() {
    this.pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string || '',
    });
    this.indexName = process.env.PINECONE_INDEX_NAME || 'chatbotllm';
    this.modelName = process.env.PINECONE_EMBEDDING_MODEL || 'multilingual-e5-large';
  }

  /**
   * Prepares and upserts text chunks into Pinecone.
   * This uses Pinecone's Inference API to generate embeddings for the text chunks.
   * 
   * @param chunks Array of text strings to be embedded and upserted
   * @param namespace Optional namespace for the index (default: 'default')
   */
  async processAndUpsertChunks(chunks: Chunk[], namespace: string = 'default') {
    if (!chunks || chunks.length === 0) {
      return { success: true, upsertedCount: 0 };
    }

    try {
      
      // 3. Upsert to Pinecone
      // Use the index instance, supporting modern configuration object
      const index = this.pc.index({ name: this.indexName }).namespace(namespace);
      
      // Upsert in batches if there are many vectors
      const batchSize = 100;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        // Flatten the metadata object into the record's root level for upsertRecords
        const formattedBatch = batch.map(chunk => {
          const { metadata, ...rest } = chunk;
          return {
            ...rest,
            ...metadata
          };
        });
        await index.upsertRecords({ records: formattedBatch as any });
      }

      return {
        success: true,
        upsertedCount: chunks.length
      };
    } catch (error) {
      console.error('Error in processAndUpsertChunks:', error);
      throw error;
    }
  }

  /**
   * Retrieves relevant chunks using Pinecone's Integrated Inference searchRecords
   * @param queryText The text to search for
   * @param projectId Filter by projectId (optional)
   * @param topK Number of chunks to retrieve
   * @param namespace The namespace to search in
   */
  async retrieveChunks(queryText: string, namespace: string, topK: number = 5) {
    try {
      const index = this.pc.index({ name: this.indexName }).namespace(namespace);
      
      const searchOptions: any = {
        query: {
          inputs: { text: queryText },
          topK: topK
        },
        fields: ['text', 'projectId', 'originalname', 'filename']
      };

      const response = await index.searchRecords(searchOptions);

      return response.result?.hits || [];
    } catch (error) {
      console.error('Error in retrieveChunks:', error);
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();
