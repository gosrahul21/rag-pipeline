import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export const recursiveTextSplitter = (extractedText: string)=>{
        // Get chunk size and overlap from env variables (with defaults)
        const chunkSize = parseInt(process.env.CHUNK_SIZE || '1000', 10);
        const chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '200', 10);
    
        // Convert text into chunks using Langchain's RecursiveCharacterTextSplitter
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
        const texts = splitter.splitText(extractedText);
        return texts;
}   