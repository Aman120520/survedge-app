/**
 * Batch Processing Utilities
 * Process large datasets in batches to prevent UI blocking
 */

/**
 * Process items in batches with progress callback
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize: number = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }

    // Yield to UI thread
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Process items in batches synchronously (for small operations)
 */
export function processBatchSync<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 1000
): R[] {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map((item) => processor(item));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

