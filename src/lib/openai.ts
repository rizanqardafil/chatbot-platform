import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder',
});

export { SUPPORTED_MODELS, type ModelId } from './models';

/**
 * Ensures a vector store exists for a project and returns its ID.
 * Creates one if it doesn't exist.
 */
export async function ensureVectorStore(projectId: string, existingVectorStoreId?: string | null): Promise<string> {
  if (existingVectorStoreId) {
    try {
      await openai.vectorStores.retrieve(existingVectorStoreId);
      return existingVectorStoreId;
    } catch {
      // Vector store not found, create a new one
    }
  }

  const vectorStore = await openai.vectorStores.create({
    name: `chatbot-platform-project-${projectId}`,
    expires_after: { anchor: 'last_active_at', days: 365 },
  });

  return vectorStore.id;
}

/**
 * Uploads a file to OpenAI and adds it to the project's vector store.
 */
export async function uploadFileToOpenAI(
  fileData: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string }> {
  const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  const uploaded = await openai.files.create({
    file,
    purpose: 'assistants',
  });

  return { fileId: uploaded.id };
}

/**
 * Adds a file to a vector store for file search.
 */
export async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
  await openai.vectorStores.files.create(vectorStoreId, { file_id: fileId });
}

/**
 * Deletes a file from OpenAI Files and removes from vector store.
 */
export async function deleteOpenAIFile(fileId: string, vectorStoreId?: string | null): Promise<void> {
  if (vectorStoreId) {
    try {
      await openai.vectorStores.files.del(vectorStoreId, fileId);
    } catch {
      // Ignore if not in vector store
    }
  }

  try {
    await openai.files.del(fileId);
  } catch {
    // Ignore if already deleted
  }
}
