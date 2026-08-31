import { ScholarlyRAGEngine } from "./rag-semantic-engine.mjs";

export function createRAGAdapter({ engine = new ScholarlyRAGEngine(), maxInputChars = 4000, maxOutputChars = 8000 } = {}) {
  function ingestTurn(text, metadata = {}) {
    const content = String(text || "").slice(0, maxInputChars);
    if (!content.trim()) return null;
    return engine.ingest(content, { ...metadata, safetyStatus: metadata.safetyStatus || "unverified" });
  }

  function contextFor(query, options = {}) {
    const results = engine.retrieve(String(query || ""), { limit: options.limit || 5, threshold: options.threshold });
    return engine.assembleGroundedPrompt(String(query || ""), results).slice(0, maxOutputChars);
  }

  return { engine, ingestTurn, contextFor };
}
