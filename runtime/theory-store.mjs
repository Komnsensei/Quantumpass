// runtime/theory-store.mjs
// Manages formal claims, invariants, and success metrics for autonomous synthesis.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class TheoryStore {
  constructor({ workspaceRoot = process.cwd(), dataDir = null } = {}) {
    this.dataDir = dataDir || join(homedir(), ".bro");
    this.storeDir = join(this.dataDir, "theory");
    this.storePath = join(this.storeDir, "claims.json");
    this._ensureStorage();
  }

  _ensureStorage() {
    if (!existsSync(this.storeDir)) {
      mkdirSync(this.storeDir, { recursive: true });
    }
    if (!existsSync(this.storePath)) {
      writeFileSync(this.storePath, JSON.stringify({ claims: [] }, null, 2));
    }
  }

  _loadStore() {
    try {
      return JSON.parse(readFileSync(this.storePath, "utf8"));
    } catch {
      return { claims: [] };
    }
  }

  _saveStore(data) {
    writeFileSync(this.storePath, JSON.stringify(data, null, 2));
  }

  /**
   * Register a new theory claim with invariants and success metrics.
   */
  addClaim({ id, statement, assumptions = [], invariants = [], successMetrics = {} }) {
    const store = this._loadStore();
    const existingIndex = store.claims.findIndex(c => c.id === id);

    const claimRecord = {
      id,
      statement,
      assumptions,
      invariants: invariants.map(inv => ({
        id: inv.id || `inv_${Math.random().toString(36).slice(2, 7)}`,
        description: inv.description,
        formalExpression: inv.formalExpression,
        severity: inv.severity || "critical"
      })),
      successMetrics,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      store.claims[existingIndex] = claimRecord;
    } else {
      store.claims.push(claimRecord);
    }

    this._saveStore(store);
    console.log(`[+] Theory claim registered/updated: ${id}`);
    return claimRecord;
  }

  getClaim(id) {
    const store = this._loadStore();
    return store.claims.find(c => c.id === id) || null;
  }

  listClaims() {
    return this._loadStore().claims;
  }
}

export const theoryStore = new TheoryStore();
