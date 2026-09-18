import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createConsciousSubstrate } from "../runtime/consciousness/index.mjs";
import { textSimilarity } from "../runtime/consciousness/metrics.mjs";

describe("consciousness substrate (gwt_v1)", () => {
  it("runs 10 reflective steps and exposes metrics shape", () => {
    const s = createConsciousSubstrate({ goal: "test_goal", capacity: 5 });
    s.setGoal("test_goal");

    let last = null;
    for (let i = 0; i < 10; i++) {
      last = s.step({
        content: `signal_${i} goal-related observation`,
        priority: 0.3 + (i % 4) * 0.15,
        tags: ["broadcast"]
      });
    }

    assert.ok(last);
    assert.equal(typeof last.report, "string");
    assert.match(last.report, /\[aware\]/);

    const m = last.metrics;
    for (const key of [
      "reportConsistency",
      "attentionSpan",
      "broadcastLoad",
      "stepCount",
      "selfModelAccuracy",
      "integrationProxy",
      "reportStability",
      "workspaceSize"
    ]) {
      assert.ok(key in m, `missing metric ${key}`);
    }

    assert.equal(m.stepCount, 10);
    assert.ok(m.workspaceSize <= 5);
    assert.ok(m.broadcastLoad >= 0 && m.broadcastLoad <= 1);
    assert.equal(m.selfModelAccuracy, 1);
  });

  it("evicts low-priority events under capacity pressure", () => {
    const s = createConsciousSubstrate({ capacity: 3 });
    s.step({ content: "low", priority: 0.1 });
    s.step({ content: "mid", priority: 0.5 });
    s.step({ content: "high", priority: 0.9 });
    s.step({ content: "higher", priority: 0.95 });
    const snap = s.workspace.snapshot();
    assert.equal(snap.length, 3);
    assert.ok(!snap.some(e => e.content === "low"));
  });

  it("textSimilarity is symmetric and bounded", () => {
    assert.equal(textSimilarity("a b c", "a b c"), 1);
    assert.equal(textSimilarity("", "x"), 0);
    const s = textSimilarity("hello world", "world peace");
    assert.ok(s > 0 && s < 1);
  });
});
