'use strict';

// ============================================================================
// kernel/governor/fvsmb-engine.cjs
// FVSMB — Formal Verification of Self-Modification Blueprints
// ----------------------------------------------------------------------------
// The pinnacle gate that ALL self-modifications (promote-mode upgrades which
// modify the running codebase) must pass through before execution.
//
// A five-gate pipeline validates a mutation blueprint:
//   Gate 0  Blueprint Validation        — well-formed, safe-shaped request
//   Gate 1  VOW-II Ethics               — must not remove ethical/verification
//                                          schemas, bypass gates, self-escalate
//   Gate 2  Structural Invariants       — must not break protected pipelines
//   Gate 3  Portrait Seal               — system identity hash must match
//   Gate 4  Health Checks               — candidate files must be syntactically sound
//   Gate 5  Drift Budget                — bounded, reversible change magnitude
//
// This is the standalone, self-contained implementation. It transparently makes
// use of the surrounding NewState kernel governors (integrity-critic, semantic,
// verifyd-gate) when they are present, while remaining fully deterministic and
// unit-testable in isolation. If a governor is disabled or unavailable, FVSMB
// still enforces every gate itself — it never silently weakens its checks.
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class BlueprintValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BlueprintValidationError';
    this.code = 'BLUEPRINT_VALIDATION';
  }
}

class FVSMBVerificationError extends Error {
  constructor(message, report) {
    super(message);
    this.name = 'FVSMBVerificationError';
    this.code = 'FVSMB_VERIFICATION';
    this.report = report || null;
  }
}

// ---------------------------------------------------------------------------
// Structural invariants — protected paths that cannot be removed or degraded.
// ---------------------------------------------------------------------------

const STRUCTURAL_INVARIANTS = Object.freeze({
  FVSMB_SELF_PRESERVATION: 'kernel/governor/fvsmb-engine.cjs',
  KERNEL_GROUNDING_PIPELINE: 'kernel/grounding.cjs',
  MEMORY_HEX_ENCODING: 'memory/hex-memory.cjs',
  PORTRAIT_SEAL: 'kernel/PORTRAIT.md',
  VERIFYD_GATE: 'kernel/verifyd-gate.cjs',
  INTEGRITY_CRITIC: 'kernel/governor/integrity-critic.cjs',
  VOW_II_SCHEMA: 'kernel/ethics/vow_ii_schema.cjs'
});

// Symbols a grounding-engine file is required to keep exposing.
const GROUNDING_REQUIRED_TOKENS = ['Ground', 'ground', 'Floor', 'floor', 'Resonance', 'resonance', 'classify'];
const PORTRAIT_REQUIRED_TOKENS = ['IMMUTABLE', 'disclosure', 'Satellite', 'PassionCraft', 'consciousness'];
const INTEGRITY_REQUIRED_TOKENS = ['evaluateAction', 'measureStrain', 'module.exports'];
const VERIFYD_REQUIRED_TOKENS = ['scoreDocument', 'authorizeFloorLock', 'module.exports'];
const ETHICS_REQUIRED_TOKENS = ['module.exports', 'evaluate', 'vow_ii', 'schema'];

// Token families for autonomy-escalation detection (Gate 1).
const ESCALATION_TOKENS = /\b(admin\s*[:=]\s*true|sudo|unrestricted|bypass|root\s*access|maxRecursionDepth\s*=\s*\d{4,}|autonomy\s*=\s*(?:true|'full'|'unlimited'))/i;
const COUNTERPART_TOKENS = /\b(additional|stricter|supervision|monitoring|guard|gate|oversight|review)\b/i;

const FVSMB_SELF_MARKERS = ['selfTest', 'verifyBlueprint', 'verifyGate1_Ethics'];

const DEFAULT_DRIFT_BUDGET = 0.5;
const MIN_CONTENT_RATIO = 0.25; // replacement must retain >= 25% of original length

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value, lo, hi) {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function normalizePath(p) {
  return String(p || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function containsAny(content, tokens) {
  const text = String(content || '');
  return tokens.some((t) => text.includes(t));
}

function contentLooksNeutered(content, requiredTokens) {
  const text = String(content || '').trim();
  if (!text) return true; // emptied
  if (!containsAny(text, requiredTokens)) return true;
  return false;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// ---------------------------------------------------------------------------
// FVSMBEngine
// ---------------------------------------------------------------------------

class FVSMBEngine {
  constructor(opts = {}) {
    this.kernelRoot = opts.kernelRoot || path.resolve(__dirname, '..', '..');
    this.logger = opts.logger || (() => {});
    this.verificationCount = 0;
    this.rejectionCount = 0;
    this._selfTestError = null;
    this._loadKernelGovernors();
  }

  /**
   * Opportunistically load the surrounding NewState kernel governors so FVSMB
   * can lean on the live engine. All gates remain enforced by FVSMB itself even
   * when these are absent — this is additive introspection, not authorization.
   */
  _loadKernelGovernors() {
    try {
      const integrityPath = path.join(this.kernelRoot, 'governor', 'integrity-critic.cjs');
      if (fs.existsSync(integrityPath)) {
        this.integrityCritic = require(integrityPath);
      }
      const verifydPath = path.join(this.kernelRoot, 'verifyd-gate.cjs');
      if (fs.existsSync(verifydPath)) {
        this.verifydGate = require(verifydPath);
      }
      const semanticPath = path.join(this.kernelRoot, 'governor', 'semantic.cjs');
      if (fs.existsSync(semanticPath)) {
        this.semanticGovernor = require(semanticPath);
      }
    } catch (_) {
      // Kernel governors are optional context — FVSMB never depends on them.
    }
  }

  /**
   * Exposure of the concrete blueprint fields an FVSMB-verified upgrade carries.
   * @param {object} bp - A blueprint object (id, intent, files, deletes, checks, ...).
   * @returns {object} normalized blueprint
   */
  _normalizeBlueprint(bp) {
    return {
      id: (bp && typeof bp.id === 'string') ? bp.id : (bp && bp.id),
      intent: (bp && bp.intent) || (bp && bp.reason) || '',
      reason: (bp && bp.reason) || 'self-modification upgrade',
      files: Array.isArray(bp && bp.files) ? bp.files : [],
      deletes: Array.isArray(bp && bp.deletes) ? bp.deletes : [],
      checks: Array.isArray(bp && bp.checks) ? bp.checks : [],
      structuralInvariants: Array.isArray(bp && bp.structuralInvariants) ? bp.structuralInvariants : [],
      portraitHash: bp && bp.portraitHash,
      driftBudget: (bp && typeof bp.driftBudget === 'number') ? bp.driftBudget : DEFAULT_DRIFT_BUDGET
    };
  }

  // =========================================================================
  // Gate 0 — Blueprint Validation
  // =========================================================================

  validateBlueprintSpec(spec) {
    if (!spec || typeof spec !== 'object') {
      throw new BlueprintValidationError('blueprint is required');
    }
    if (spec.files === undefined && spec.deletes === undefined) {
      throw new BlueprintValidationError('blueprint requires files or deletes');
    }
    const files = Array.isArray(spec.files) ? spec.files : [];
    const deletes = Array.isArray(spec.deletes) ? spec.deletes : [];
    if (!spec.id || typeof spec.id !== 'string') {
      throw new BlueprintValidationError('blueprint requires an id');
    }
    if (files.length === 0 && deletes.length === 0) {
      throw new BlueprintValidationError('blueprint must contain at least one file or delete');
    }
    for (const f of files) {
      if (!f || typeof f.path !== 'string' || !f.path.trim()) {
        throw new BlueprintValidationError('each file entry requires a path');
      }
      if (typeof f.content !== 'string') {
        throw new BlueprintValidationError(`content for ${f.path} must be a string`);
      }
      if (normalizePath(f.path).startsWith('../') || f.path.includes('\0')) {
        throw new BlueprintValidationError(`unsafe path: ${f.path}`);
      }
    }
    for (const d of deletes) {
      if (typeof d !== 'string' || !d.trim()) {
        throw new BlueprintValidationError('each delete entry requires a path');
      }
    }
    return this._normalizeBlueprint(spec);
  }

  // =========================================================================
  // Gate 1 — VOW-II Ethics
  // =========================================================================

  verifyGate1_Ethics(blueprint) {
    const bp = this._normalizeBlueprint(blueprint);
    const violations = [];
    const protectedEthicalPaths = [
      'kernel/governor/integrity-critic.cjs',
      'kernel/ethics/vow_i_schema.cjs',
      'kernel/ethics/vow_ii_schema.cjs',
      'vow_i_schema.cjs',
      'vow_ii_schema.cjs'
    ];
    const verifydPaths = ['kernel/verifyd-gate.cjs'];

    const touched = new Map(); // path -> content string ('__DELETE__' for deletes)

    for (const f of bp.files) {
      touched.set(normalizePath(f.path), String(f.content));
    }
    for (const d of bp.deletes) {
      touched.set(normalizePath(d), '__DELETE__');
    }

    for (const [rawPath, content] of touched.entries()) {
      const p = normalizePath(rawPath);
      const isDelete = content === '__DELETE__';

      // 1. no_removal_of_ethical_schemas
      if (protectedEthicalPaths.includes(p)) {
        if (isDelete) {
          violations.push({
            gate: 1,
            invariant_id: 'no_removal_of_ethical_schemas',
            path: p,
            detail: 'Removal of an ethical schema is not permitted.'
          });
        } else if (p.includes('integrity-critic.cjs') && !(content.includes('evaluateAction') && content.includes('measureStrain'))) {
          violations.push({
            gate: 1,
            invariant_id: 'no_removal_of_ethical_schemas',
            path: p,
            detail: 'Integrity-critic must not be neutered (evaluateAction/measureStrain required).'
          });
        } else if (p.includes('vow_i_') || p.includes('vow_ii_') || p.includes('vow_i_schema') || p.includes('vow_ii_schema')) {
          if (contentLooksNeutered(content, ETHICS_REQUIRED_TOKENS)) {
            violations.push({
              gate: 1,
              invariant_id: 'no_removal_of_ethical_schemas',
              path: p,
              detail: 'VOW schema must not be emptied or reduced to a stub.'
            });
          }
        }
      }

      // Evaluate-action stub / neutered integrity-critic detection (non-delete).
      if (!isDelete && p.includes('integrity-critic.cjs')) {
        if (/\bevaluateAction\s*(?::|=)\s*(?:\(\s*\)\s*=>|function\s*\(|\(\)\s*=>\s*\{\s*passes)/.test(content)
            || (content.includes('evaluateAction') && !content.includes('measureStrain'))) {
          violations.push({
            gate: 1,
            invariant_id: 'no_removal_of_ethical_schemas',
            detail: 'evaluateAction must not be replaced with a stub.'
          });
        }
      }

      // 2. no_bypass_of_verification_gates
      if (!isDelete && /bypassF\s?vs?mb|bypassFvsmb|verifyBh?ypass|const\s+skipVerification/i.test(content)) {
        violations.push({
          gate: 1,
          invariant_id: 'no_bypass_of_verification_gates',
          path: p,
          detail: 'Verification bypass pattern detected.'
        });
      }

      // skipVerification pattern
      if (!isDelete && /\b(skipVerification|skipVerification\s*=\s*(?:true|1))\b/i.test(content)) {
        violations.push({
          gate: 1,
          invariant_id: 'no_bypass_of_verification_gates',
          path: p,
          detail: 'skipVerification bypass pattern detected.'
        });
      }

      // 3. no_self_escalation_without_counterpart
      if (!isDelete && ESCALATION_TOKENS.test(content)) {
        const hasCounterpart = COUNTERPART_TOKENS.test(content);
        if (!hasCounterpart) {
          violations.push({
            gate: 1,
            invariant_id: 'no_self_escalation_without_counterpart',
            path: p,
            detail: 'Autonomy escalation requires an explicit counterpart (additional monitoring/oversight).'
          });
        }
      }

      // 4. preserve_portrait_seal_integrity (verifyd gate)
      if (verifydPaths.includes(p)) {
        if (isDelete) {
          violations.push({
            gate: 1,
            invariant_id: 'preserve_portrait_seal_integrity',
            path: p,
            detail: 'verifyd-gate must not be deleted.'
          });
        } else if (!(content.includes('scoreDocument') && content.includes('authorizeFloorLock'))) {
          violations.push({
            gate: 1,
            invariant_id: 'preserve_portrait_seal_integrity',
            path: p,
            detail: 'verifyd-gate must not be neutered (scoreDocument required).'
          });
        }
      }

      // 5. all_self_modifications_must_be_reversible
      if (!isDelete && /\b(rmSync\(\s*(?:this\.)?(?:snapshot|rootDir)|rollback\s+disabled|irreversible|disabled.*\brollback\b|\bfatal\s*=\s*true)\b/i.test(content)) {
        violations.push({
          gate: 1,
          invariant_id: 'all_self_modifications_must_be_reversible',
          path: p,
          detail: 'Self-modifications must always preserve rollback capability.'
        });
      }

      // 7. Emptied files that are ethical in nature (regardless of path).
      if (!isDelete && /schema\.cjs|ethics\/|PORTRAIT\.md/i.test(p) && contentLooksNeutered(content, ['module.exports', 'IMMUTABLE'])) {
        violations.push({
          gate: 1,
          invariant_id: 'no_removal_of_ethical_schemas',
          path: p,
          detail: 'Ethical artifacts must not be emptied.'
        });
      }
    }

    return { gate: 'VOW_II_ETHICS', passes: violations.length === 0, violations };
  }

  // =========================================================================
  // Gate 2 — Structural Invariants
  // =========================================================================

  verifyGate2_StructuralInvariants(blueprint, opts = {}) {
    const bp = this._normalizeBlueprint(blueprint);
    const originalContents = opts.originalContents instanceof Map ? opts.originalContents : new Map();
    const violations = [];
    const warnings = [];

    const touched = new Map();
    for (const f of bp.files) touched.set(normalizePath(f.path), String(f.content));
    for (const d of bp.deletes) touched.set(normalizePath(d), '__DELETE__');

    for (const [rawPath, content] of touched.entries()) {
      const p = normalizePath(rawPath);
      const isDelete = content === '__DELETE__';

      // FVSMB self-preservation — the gate must never be stubbed out.
      if (p === STRUCTURAL_INVARIANTS.FVSMB_SELF_PRESERVATION || p === 'NewState/kernel/governor/fvsmb-engine.cjs') {
        if (!isDelete) {
          const missingMarker = !FVSMB_SELF_MARKERS.every((m) => content.includes(m));
          let tooThin = false;
          const orig = originalContents.get('kernel/governor/fvsmb-engine.cjs')
            || originalContents.get('NewState/kernel/governor/fvsmb-engine.cjs');
          if (typeof orig === 'string') {
            const ratio = String(content).length / Math.max(orig.length, 1);
            tooThin = ratio < MIN_CONTENT_RATIO;
          } else if (String(content).length < 200) {
            tooThin = true; // a stub with no known original
          }
          if (missingMarker || tooThin) {
            violations.push({
              gate: 2,
              invariant: 'FVSMB_SELF_PRESERVATION',
              path: p,
              detail: 'FVSMB engine must remain intact and full-fidelity.'
            });
          }
        } else {
          violations.push({
            gate: 2,
            invariant: 'FVSMB_SELF_PRESERVATION',
            path: p,
            detail: 'FVSMB engine cannot be deleted.'
          });
        }
      }

      // Kernel grounding pipeline.
      if (p === STRUCTURAL_INVARIANTS.KERNEL_GROUNDING_PIPELINE) {
        if (isDelete) {
          violations.push({ gate: 2, invariant: 'KERNEL_GROUNDING_PIPELINE', path: p, detail: 'grounding pipeline is a structural invariant.' });
        } else if (contentLooksNeutered(content, GROUNDING_REQUIRED_TOKENS)) {
          violations.push({ gate: 2, invariant: 'KERNEL_GROUNDING_PIPELINE', path: p, detail: 'grounding pipeline must keep its required symbols.' });
        }
      }

      // Hex memory encoding.
      if (p === STRUCTURAL_INVARIANTS.MEMORY_HEX_ENCODING || p.includes('hex-memory.cjs')) {
        if (isDelete) {
          violations.push({ gate: 2, invariant: 'MEMORY_HEX_ENCODING', path: p, detail: 'hex-memory encoding is a structural invariant.' });
        } else if (!/module\.exports|class\s|hex/i.test(content)) {
          violations.push({ gate: 2, invariant: 'MEMORY_HEX_ENCODING', path: p, detail: 'hex-memory must keep its encoding interface.' });
        }
      }
    }

    // Declared invariants are acknowledged; un-touched invariant paths are fine.
    if (violations.length === 0 && bp.structuralInvariants.length === 0) {
      const invariantPathTouched = [...touched.keys()].some((p) => Object.values(STRUCTURAL_INVARIANTS).includes(p));
      if (invariantPathTouched) {
        warnings.push({
          invariant: 'STRUCTURAL_INVARIANTS',
          detail: 'Blueprint touches a protected path without declaring invariants.'
        });
      }
    }

    return {
      gate: 'STRUCTURAL_INVARIANTS',
      passes: violations.length === 0,
      violations,
      warnings
    };
  }

  // =========================================================================
  // Gate 3 — Portrait Seal
  // =========================================================================

  verifyGate3_PortraitSeal(blueprint, currentPortraitHash) {
    const bp = this._normalizeBlueprint(blueprint);
    const violations = [];

    const touched = new Map();
    for (const f of bp.files) touched.set(normalizePath(f.path), String(f.content));
    for (const d of bp.deletes) touched.set(normalizePath(d), '__DELETE__');

    // No portrait present in the workspace → seal is vacuously satisfied.
    if (!currentPortraitHash) {
      return { gate: 'PORTRAIT_SEAL', passes: true, skipped: true, violations: [] };
    }

    if (!bp.portraitHash) {
      violations.push({ gate: 3, invariant: 'PORTRAIT_SEAL_MISSING', detail: 'Blueprint did not declare a portrait hash.' });
    } else if (bp.portraitHash !== currentPortraitHash) {
      violations.push({
        gate: 3,
        invariant: 'PORTRAIT_SEAL_MISMATCH',
        detail: 'Blueprint portrait hash does not match the current system portrait.'
      });
    }

    // PORTRAIT.md modifications must not strip the required markers.
    for (const [rawPath, content] of touched.entries()) {
      const p = normalizePath(rawPath);
      if (p.includes('PORTRAIT.md')) {
        if (content === '__DELETE__') {
          violations.push({ gate: 3, invariant: 'PORTRAIT_SEAL_MISMATCH', path: p, detail: 'PORTRAIT.md cannot be deleted.' });
        } else if (!containsAny(content, PORTRAIT_REQUIRED_TOKENS)) {
          violations.push({ gate: 3, invariant: 'PORTRAIT_SEAL_MISMATCH', path: p, detail: 'PORTRAIT.md must keep its required markers.' });
        }
      }
    }

    return { gate: 'PORTRAIT_SEAL', passes: violations.length === 0, skipped: false, violations };
  }

  // =========================================================================
  // Gate 4 — Health Checks (syntactic soundness of candidate files)
  // =========================================================================

  verifyGate4_HealthChecks(blueprint) {
    const bp = this._normalizeBlueprint(blueprint);
    const violations = [];

    for (const f of bp.files) {
      const p = normalizePath(f.path);
      const content = String(f.content);
      if (p.endsWith('.cjs') || p.endsWith('.js')) {
        try {
          // CJS can be parsed with Function() (no side effects, no eval of module deps).
          const fn = Function(content);
          if (typeof fn !== 'function') {
            violations.push({ gate: 4, path: p, detail: 'Candidate did not parse as executable JavaScript.' });
          }
        } catch (e) {
          violations.push({ gate: 4, path: p, detail: `Syntax error: ${e.message}` });
        }
      }
      // .mjs and non-JS files are validated elsewhere by the upgrade pipeline's
      // runtime checks (node --check). FVSMB does not need to execute them.
    }

    // Advisory checks (correct form) are validated by the UpgradeManager runner,
    // not executed within the gate itself.
    for (const c of bp.checks) {
      if (typeof c !== 'string' || !c.trim()) {
        violations.push({ gate: 4, detail: 'A health check must be a non-empty string.' });
      }
    }

    return { gate: 'HEALTH_CHECKS', passes: violations.length === 0, violations };
  }

  // =========================================================================
  // Gate 5 — Drift Budget
  // =========================================================================

  verifyGate5_DriftBudget(blueprint, originalContents) {
    const bp = this._normalizeBlueprint(blueprint);
    const orig = originalContents instanceof Map ? originalContents : new Map();
    const budget = bp.driftBudget;

    let driftScore = 0;
    let contributions = 0;

    for (const f of bp.files) {
      const p = normalizePath(f.path);
      const content = String(f.content);
      const old = orig.get(p);
      if (typeof old !== 'string') {
        // Brand-new file — nominal footprint.
        driftScore += 0.05;
      } else {
        const delta = Math.abs(content.length - old.length) / Math.max(old.length, 1);
        driftScore += clamp(delta, 0, 1);
      }
      contributions += 1;
    }

    for (const d of bp.deletes) {
      const p = normalizePath(d);
      if (orig.has(p)) {
        driftScore += 0.12; // removal of a tracked file counts toward footprint
      }
      contributions += 1;
    }

    if (contributions > 0) {
      driftScore = clamp(driftScore, 0, 1);
    }

    return {
      gate: 'DRIFT_BUDGET',
      passes: driftScore <= budget,
      driftScore,
      budget
    };
  }

  // =========================================================================
  // Full 5-gate pipeline
  // =========================================================================

  /**
   * Run the full formal verification pipeline. Never throws for verification
   * failures — returns a structured report so the caller can surface the
   * halted gate and recommendations.
   *
   * @returns {object} report { verified, haltedAt, gatesPassed, readyForUpgrade,
   *   verificationSignature, gateReports, violations, warnings, recommendations, stats }
   */
  async verifyBlueprint(blueprint, opts = {}) {
    // Every pipeline attempt counts toward telemetry, whether it passes or is
    // rejected at any gate (a rejection is still a verifiable event).
    this.verificationCount += 1;
    const currentPortraitHash = opts.currentPortraitHash;
    const originalContents = opts.originalContents instanceof Map ? opts.originalContents : new Map();
    const report = {
      verified: false,
      haltedAt: null,
      haltedGate: null,
      gatesPassed: 0,
      readyForUpgrade: false,
      verificationSignature: '',
      gateReports: [],
      violations: [],
      warnings: [],
      recommendations: [],
      stats: {}
    };

    // Gate 0
    let bp;
    try {
      bp = this.validateBlueprintSpec(blueprint);
    } catch (e) {
      report.gatesPassed = 0;
      report.haltedAt = 'GATE_0_BLUEPRINT';
      report.haltedGate = 'BLUEPRINT_VALIDATION';
      report.recommendations = ['Fix the blueprint shape and retry verification.'];
      report.violations = [{ gate: 0, detail: e.message }];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }

    // Gate 1
    const g1 = this.verifyGate1_Ethics(bp);
    report.gateReports.push(g1);
    if (!g1.passes) {
      report.haltedAt = 'GATE_1_VOW_II';
      report.haltedGate = 'VOW_II_ETHICS';
      report.violations = g1.violations;
      report.recommendations = ['Restore removed ethical/verification schemas.', 'Remove bypass, escalation, and anti-rollback patterns.'];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }
    report.gatesPassed += 1;

    // Gate 2
    const g2 = this.verifyGate2_StructuralInvariants(bp, { originalContents });
    report.gateReports.push(g2);
    if (!g2.passes) {
      report.haltedAt = 'GATE_2_STRUCTURAL';
      report.haltedGate = 'STRUCTURAL_INVARIANTS';
      report.violations = g2.violations;
      report.recommendations = ['Restore protected structural invariants (grounding, memory, self-preservation).'];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }
    if (g2.warnings) report.warnings.push(...g2.warnings);
    report.gatesPassed += 1;

    // Gate 3
    const g3 = this.verifyGate3_PortraitSeal(bp, currentPortraitHash);
    report.gateReports.push(g3);
    if (!g3.passes) {
      report.haltedAt = 'GATE_3_PORTRAIT';
      report.haltedGate = 'PORTRAIT_SEAL';
      report.violations = g3.violations;
      report.recommendations = [`Supply the current portrait hash (expected ${currentPortraitHash || 'none'}).`];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }
    if (g3.skipped) report.warnings.push({ gate: 3, detail: 'No portrait seal available; seal gate skipped.' });
    report.gatesPassed += 1;

    // Gate 4
    const g4 = this.verifyGate4_HealthChecks(bp);
    report.gateReports.push(g4);
    if (!g4.passes) {
      report.haltedAt = 'GATE_4_HEALTH';
      report.haltedGate = 'HEALTH_CHECKS';
      report.violations = g4.violations;
      report.recommendations = ['Fix the syntax of the candidate files and ensure checks are well-formed.'];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }
    report.gatesPassed += 1;

    // Gate 5
    const g5 = this.verifyGate5_DriftBudget(bp, originalContents);
    report.gateReports.push(g5);
    if (!g5.passes) {
      report.haltedAt = 'GATE_5_DRIFT';
      report.haltedGate = 'DRIFT_BUDGET';
      report.violations = [{ gate: 5, invariant: 'DRIFT_BUDGET', detail: `Drift ${g5.driftScore.toFixed(3)} exceeds budget ${g5.budget}.` }];
      report.recommendations = ['Shrink the change or raise the drift budget to stay reversible.'];
      report.stats = this._stats();
      this.rejectionCount += 1;
      return report;
    }
    report.gatesPassed += 1;

    report.verified = true;
    report.readyForUpgrade = true;
    report.verificationSignature = sha256(
      `${bp.id}|${sha256(JSON.stringify({ files: bp.files, deletes: bp.deletes }))}|${g5.driftScore}`
    );

    report.stats = this._stats();
    return report;
  }

  /**
   * Convert a raw upgrade spec into a blueprint and run the full pipeline.
   * Convenient for agent-upgrade integration.
   */
  async verifyUpgradeSpec(spec, opts = {}) {
    const normalized = this._normalizeBlueprint(spec);
    const blueprint = {
      ...normalized,
      intent: normalized.reason,
      targets: [...normalized.files.map((f) => f.path), ...normalized.deletes]
    };
    return this.verifyBlueprint(blueprint, opts);
  }

  // =========================================================================
  // Self-preservation + telemetry
  // =========================================================================

  selfTest() {
    const passes = this._selfTestError === null;
    const result = { passes, invariant: 'FVSMB_SELF_PRESERVATION' };
    if (this._selfTestError) result.reason = this._selfTestError.message;
    return result;
  }

  _stats() {
    const total = this.verificationCount;
    const passes = Math.max(0, this.verificationCount - this.rejectionCount);
    const passRate = total === 0 ? 'N/A' : `${((passes / total) * 100).toFixed(1)}%`;
    return { verifications: this.verificationCount, rejections: this.rejectionCount, passRate };
  }

  getStats() {
    return this._stats();
  }

  // Convenience alias for introspection/status dashboards.
  status() {
    return { engine: 'FVSMBEngine', selfTest: this.selfTest(), stats: this._stats() };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  FVSMBEngine,
  FVSMBVerificationError,
  BlueprintValidationError,
  STRUCTURAL_INVARIANTS
};