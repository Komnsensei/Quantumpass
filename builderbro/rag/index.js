/**
 * BuilderBro RAG Core — QuantumPass
 * Zero heavy external deps. File-based store + simple lexical retrieval.
 * Can later be swapped for embedding backends (local or API) without changing the public interface.
 *
 * Public API:
 *   ingest(docs)          — add documents (string | {id, text, meta})
 *   retrieve(query, k)    — return top-k grounded chunks
 *   ground(query, k)      — retrieve + format as context block for LLM
 *   list()                — inventory of stored documents
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_DIR = path.join(__dirname, 'store');
const INDEX_FILE = path.join(STORE_DIR, 'index.json');

function ensureStore() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, JSON.stringify({ docs: [], version: 1 }, null, 2));
}

function loadIndex() {
  ensureStore();
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

function saveIndex(idx) {
  ensureStore();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));
}

function chunkText(text, size = 800, overlap = 120) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks.filter(Boolean);
}

function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

function score(queryTokens, chunkTokens) {
  const set = new Set(chunkTokens);
  let hits = 0;
  for (const t of queryTokens) if (set.has(t)) hits++;
  return hits / (queryTokens.length || 1);
}

/**
 * Ingest one or more documents.
 * @param {string|object|array} input
 */
export function ingest(input) {
  const idx = loadIndex();
  const items = Array.isArray(input) ? input : [input];

  for (let raw of items) {
    let doc;
    if (typeof raw === 'string') {
      doc = { id: crypto.randomUUID(), text: raw, meta: { source: 'inline', ingestedAt: new Date().toISOString() } };
    } else {
      doc = {
        id: raw.id || crypto.randomUUID(),
        text: raw.text || '',
        meta: { ...(raw.meta || {}), ingestedAt: new Date().toISOString() }
      };
    }

    const chunks = chunkText(doc.text).map((c, i) => ({
      chunkId: `${doc.id}:${i}`,
      docId: doc.id,
      text: c,
      tokens: tokenize(c),
      meta: doc.meta
    }));

    // remove previous version of same id if present
    idx.docs = idx.docs.filter(d => d.id !== doc.id);
    idx.docs.push({ id: doc.id, meta: doc.meta, chunkCount: chunks.length });

    // write chunks
    const chunkFile = path.join(STORE_DIR, `${doc.id}.json`);
    fs.writeFileSync(chunkFile, JSON.stringify(chunks, null, 2));
  }

  saveIndex(idx);
  return { ingested: items.length, totalDocs: idx.docs.length };
}

/**
 * Retrieve top-k chunks for a query.
 */
export function retrieve(query, k = 6) {
  const idx = loadIndex();
  const qTokens = tokenize(query);
  const scored = [];

  for (const d of idx.docs) {
    const chunkFile = path.join(STORE_DIR, `${d.id}.json`);
    if (!fs.existsSync(chunkFile)) continue;
    const chunks = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
    for (const c of chunks) {
      const s = score(qTokens, c.tokens);
      if (s > 0) scored.push({ ...c, score: s });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Produce a grounded context block ready for LLM system / user prompt.
 */
export function ground(query, k = 6) {
  const hits = retrieve(query, k);
  if (!hits.length) return { context: '', hits: [] };

  const context = hits.map((h, i) => {
    const src = h.meta?.source || h.docId;
    return `[${i + 1}] (score=${h.score.toFixed(3)} source=${src})\n${h.text}`;
  }).join('\n\n---\n\n');

  return { context, hits };
}

export function list() {
  return loadIndex().docs;
}

// CLI convenience
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const cmd = process.argv[2];
  if (cmd === 'list') {
    console.log(JSON.stringify(list(), null, 2));
  } else if (cmd === 'ingest' && process.argv[3]) {
    const text = fs.readFileSync(process.argv[3], 'utf8');
    console.log(ingest({ text, meta: { source: process.argv[3] } }));
  } else if (cmd === 'query' && process.argv[3]) {
    console.log(JSON.stringify(ground(process.argv[3]), null, 2));
  } else {
    console.log('Usage: node index.js list | ingest <file> | query "..."');
  }
}
