export const ACTION_POLICY = Object.freeze({
  conversational: "automatic",
  workspaceRead: "automatic",
  workspaceWrite: "confirm-once-per-session",
  externalNetwork: "confirm-per-action",
  credentials: "confirm-per-action",
  destructive: "confirm-per-action",
  selfModification: "formal-verification-required"
});

export function requiresApproval(category, { autonomyConfirmed = false } = {}) {
  const policy = ACTION_POLICY[category] || "confirm-per-action";
  if (policy === "automatic") return false;
  if (policy === "confirm-once-per-session") return !autonomyConfirmed;
  return true;
}
