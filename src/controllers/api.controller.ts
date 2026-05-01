import { Request, Response } from 'express';
import { pineconeService } from '../services/pinecone.service';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
};


export const retrieveChunksHandler = async (req: Request, res: Response) => {
  try {
    const { query, projectId, topK =3 } = req.body;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query text is required for retrieval'
      });
    }

    const limit = topK ? parseInt(topK as string, 10) : 5;

    const chunks = await pineconeService.retrieveChunks(query as string, projectId as string, limit);

    res.status(200).json({
      status: 'success',
      data: {
        chunks: chunks.map((hit: any) => ({
          id: hit.id,
          score: hit.score,
          text: hit.fields?.text,
          originalname: hit.fields?.originalname,
          filename: hit.fields?.filename,
          projectId: hit.fields?.projectId
        }))
      }
    });
  } catch (error) {
    console.error('Error in retrieveChunksHandler:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred during chunk retrieval'
    });
  }
};
