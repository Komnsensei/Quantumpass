---
name: builderbro-rag
description: Use for any retrieval, grounding, or knowledge lookup over QuantumPass docs, passes, ledger, or previously ingested material. Triggers include RAG, retrieve, ground, context, knowledge base, search project knowledge.
---

# BuilderBro RAG

## When to use
Any time the agent needs grounded context from the QuantumPass corpus, BuilderBro store, or previously ingested documents.

## Instructions
1. Import from the RAG module:
   ```js
   import { ground, retrieve, ingest, list } from '../../rag/index.js'
   ```
2. Prefer `ground(query, k)` — it returns a ready-to-inject context block plus scored hits.
3. Always surface the source of each hit when answering.
4. If the required knowledge is missing, offer to `ingest` new material (files, pass JSON, ledger entries, web results).
5. After ingesting high-value material, re-query to confirm the new knowledge is retrievable.
6. Keep the store clean: prefer canonical sources (ARCHITECTURE.md, BUILD_SPEC, self-building-protocol, live pass data).

## Notes
- Current backend is lexical (zero external deps). It can be upgraded to embeddings later without changing this skill interface.
- All significant ingests should be archived under QuantumPass law.
