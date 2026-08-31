const HIGH_IMPACT = [
  { pattern: /^!/, action: "shell execution" },
  { pattern: /\b(rm|del|erase|rmdir|remove|unlink|mv|move|cp|copy|write|append|patch|mkdir|backup)\b/i, action: "filesystem modification" },
  { pattern: /\b(deploy|push|publish|broadcast|send)\b/i, action: "external or deployment action" },
  { pattern: /\b(secret|token|password|credential|harvest|brute|slave|memdump|sniff)\b/i, action: "security-sensitive operation" },
  { pattern: /\b(self|evolve|upgrade|modify)\b/i, action: "self-modification" }
];

export function classifyAction(input) {
  const value = String(input || "").trim();
  return HIGH_IMPACT.find(rule => rule.pattern.test(value)) || null;
}

export function createPolicy({ confirm = null, output = process.stdout, rememberApprovals = true } = {}) {
  const approved = new Set();
  return async function authorize(input, { persona = null, source = "cli" } = {}) {
    const classification = classifyAction(input);
    if (!classification) return true; // read-only / benign actions always allowed
    if (persona?.yoloMode >= 10) return true; // persona explicitly cleared for high-impact
    const key = `${source||"cli"}::${classification.action}`;
    if (rememberApprovals && approved.has(key)) return true; // approved once this session
    if (typeof confirm !== "function") {
      output.write(`Blocked: ${classification.action} requires confirmation.\n`);
      return false;
    }
    const ok = Boolean(await confirm({ input: String(input), action: classification.action, source }));
    if (ok && rememberApprovals) approved.add(key);
    return ok;
  };
}
