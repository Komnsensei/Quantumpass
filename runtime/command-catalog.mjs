export const COMMAND_CATALOG = [
  { name: "/help", group: "core", description: "Show available commands" },
  { name: "/status", group: "core", description: "Show runtime status" },
  { name: "/persona", group: "persona", description: "List, create, or hot-switch personas" },
  { name: "/brofiences", group: "persona", description: "Show persona principles and operating style" },
  { name: "/k1", group: "operations", description: "Open the classified operations menu" },
  { name: "/git", group: "development", description: "Inspect repository state" },
  { name: "/build", group: "development", description: "Start the project builder" },
  { name: "/skills", group: "development", description: "Manage skills" },
  { name: "/theory", group: "autonomy", description: "Theory claims: add | list | build" },
  { name: "/aware", group: "autonomy", description: "Conscious substrate: status | step | report | run" },
  { name: "/aware status", group: "autonomy", description: "Workspace + self-model + metrics" },
  { name: "/aware step", group: "autonomy", description: "Inject percept and run one reflective step" },
  { name: "/aware report", group: "autonomy", description: "Last natural-language awareness report" },
  { name: "/freebuff", group: "autonomy", description: "Freebuff free agents via CLI credentials + SDK" },
  { name: "/thought", group: "runtime", description: "Toggle safe processing summaries" },
  { name: "/pause", group: "runtime", description: "Pause the current turn" },
  { name: "/resume", group: "runtime", description: "Resume a paused turn" },
  { name: "/auto", group: "autonomy", description: "Configure confirmed autonomous execution" },
  { name: "/help k1", group: "operations", description: "List every registered K1 operation" },
  { name: "/blackhat", group: "security", description: "Authorized defensive security workflows only" },
  { name: "/newstate", group: "sidecar", description: "Check the NewState sidecar" }
];

export const K1_COMMANDS = [
  ["scan", "workspace audit"],
  ["git", "status and recent commits"],
  ["diff", "working tree diff"],
  ["review <file>", "code review"],
  ["explain <file>", "explain a file"],
  ["test <file>", "test planning"],
  ["health", "runtime health checks"],
  ["backup", "create a guarded workspace snapshot"],
  ["blackhat audit", "authorized defensive audit"],
  ["blackhat lab", "isolated local lab workflow"]
];

export function formatCommandMenu() {
  const groups = new Map();
  for (const command of COMMAND_CATALOG) {
    if (!groups.has(command.group)) groups.set(command.group, []);
    groups.get(command.group).push(command);
  }
  return [...groups.entries()].map(([group, commands]) => [
    group.toUpperCase(),
    ...commands.map(command => `${command.name.padEnd(18)} ${command.description}`)
  ].join("\n")).join("\n\n");
}

export function formatK1Menu() {
  return K1_COMMANDS.map(([command, description]) => `/k1 ${command.padEnd(18)} ${description}`).join("\n");
}
