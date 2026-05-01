import { Request, Response } from 'express';
import fs from 'fs';
import {PDFParse} from 'pdf-parse';
import mammoth from 'mammoth';

import { pineconeService } from '../services/pinecone.service';
import { recursiveTextSplitter } from '../services/recursiveTextSplitter';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded or invalid file format. Please upload a PDF or Word document.'
      });
    }
    const projectId = req.query.projectId as string;
    if(!projectId)
      throw new Error("ProjectId is required");

    // Extract file details
    const { originalname, filename, path, size, mimetype } = req.file;

    // Identify the document type and extract text
    let extractedText = '';

    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(path);
      const pdfParse = new PDFParse({data: dataBuffer})
      const data = await pdfParse.getText();
      extractedText = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ path });
      extractedText = result.value;
    } else {
      // Attempt to read as a plain text file if not PDF or Word
      extractedText = fs.readFileSync(path, 'utf-8');
    }

    if (!extractedText || extractedText.trim() === '') {
      throw new Error("No text could be extracted from the document");
    }

    const chunkStrings = await recursiveTextSplitter(extractedText);

    // Map the string chunks to the Chunk interface expected by pineconeService
    const chunks = chunkStrings.map((text) => ({
      id: crypto.randomUUID(),
      text: text,
      metadata: {
        projectId,
        originalname,
        filename,
      }
    }));

    // Send chunks to pinecone for upserting
    await pineconeService.processAndUpsertChunks(chunks, projectId);
    fs.unlinkSync(path);
    res.status(200).json({
      status: 'success',
      message: 'File processed and uploaded successfully',
      data: {
        document: {
          originalname,
          filename,
          path,
          size,
          mimetype,
          chunksProcessed: chunks.length
        }
      }
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred during file upload'
    });
  }
};
