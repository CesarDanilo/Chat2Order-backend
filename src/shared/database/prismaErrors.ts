const RECORD_NOT_FOUND = "P2025";

// Devolve null quando o registro não existe ou pertence a outra conta.
export async function nullIfNotFound<T>(operation: Promise<T>): Promise<T | null> {
  try {
    return await operation;
  } catch (error: any) {
    if (error.code === RECORD_NOT_FOUND) return null;
    throw error;
  }
}
