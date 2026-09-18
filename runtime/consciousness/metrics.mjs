// Measurable proxies for reportable awareness (not claims of sentience).

/**
 * Simple token Jaccard similarity for report consistency.
 */
export function textSimilarity(a, b) {
  const ta = new Set(String(a || "").toLowerCase().split(/\W+/).filter(Boolean));
  const tb = new Set(String(b || "").toLowerCase().split(/\W+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / new Set([...ta, ...tb]).size;
}

/**
 * @param {{ workspace: import('./workspace.mjs').GlobalWorkspace, selfModel: import('./self-model.mjs').SelfModel, lastReport?: string, prevReport?: string, activeGoal?: string }} ctx
 */
export function computeMetrics(ctx) {
  const snap = ctx.workspace.snapshot();
  const top = snap[0];
  const report = ctx.lastReport || "";
  const workspaceText = snap.map(e => e.content).join(" ");

  // How well the NL report reflects workspace contents
  const reportConsistency = textSimilarity(report, workspaceText);

  // Attention span: consecutive presence of same top id in recent log order is approximated
  // by whether focus belief matches top content
  const focus = ctx.selfModel.snapshot().focus;
  const attentionSpan = focus && top && focus === top.content ? 1 : 0;

  const broadcastLoad = ctx.workspace.broadcastLoad;
  const stepCount = ctx.selfModel.snapshot().stepCount || 0;
  const selfModelAccuracy = ctx.selfModel.goalAccuracy(ctx.activeGoal);

  // Integration proxy: fraction of events that have a 'broadcast' tag or source !== local
  const integrated = snap.filter(e => e.source !== "local" || (e.tags || []).includes("broadcast")).length;
  const integrationProxy = snap.length ? integrated / snap.length : 0;

  // Report-to-report consistency
  const reportStability = ctx.prevReport
    ? textSimilarity(ctx.prevReport, ctx.lastReport || "")
    : 0;

  return {
    reportConsistency: Number(reportConsistency.toFixed(3)),
    attentionSpan,
    broadcastLoad: Number(broadcastLoad.toFixed(3)),
    stepCount,
    selfModelAccuracy,
    integrationProxy: Number(integrationProxy.toFixed(3)),
    reportStability: Number(reportStability.toFixed(3)),
    workspaceSize: snap.length,
    topContent: top?.content?.slice(0, 120) || null
  };
}
