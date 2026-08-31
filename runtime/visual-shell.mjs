const ANSI = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m"
};

export function createVisualShell({ output = process.stdout } = {}) {
  let expanded = true;
  let frame = 0;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const summaries = [];

  function write(line = "") { output.write(line + "\n"); }

  function render(event) {
    if (!event) return;
    if (event.type === "thinking" || event.type === "progress") {
      frame = (frame + 1) % frames.length;
      summaries.push(event.summary || event.message || "processing");
      if (expanded) write(`${ANSI.cyan}${frames[frame]}${ANSI.reset} ${event.summary || event.message || "Processing"}`);
      return;
    }
    if (event.type === "retry") {
      write(`${ANSI.yellow}↻ retry ${event.attempt} in ${event.delay}ms: ${event.error || "transient failure"}${ANSI.reset}`);
      return;
    }
    if (event.type === "tool") {
      summaries.push(`tool: ${event.name || "unnamed"}`);
      if (expanded) write(`${ANSI.dim}◆ tool ${event.name || "unnamed"}${ANSI.reset}`);
      return;
    }
    if (event.type === "paused" || event.type === "question") {
      write(`${ANSI.yellow}⏸ ${event.reason || event.prompt || "Turn paused"}${ANSI.reset}`);
      return;
    }
    if (event.type === "completed") {
      write(`${ANSI.green}✓ turn complete${ANSI.reset}`);
      if (!expanded && summaries.length) write(`${ANSI.dim}  ${summaries.length} processing events hidden; use /thought expand to show them.${ANSI.reset}`);
      return;
    }
    if (event.type === "error") write(`${ANSI.yellow}⚠ ${event.code ? `[${event.code}] ` : ""}${event.error || "runtime error"}${ANSI.reset}`);
  }

  function toggle(value) {
    expanded = value === undefined ? !expanded : Boolean(value);
    write(`${ANSI.dim}Processing summaries ${expanded ? "expanded" : "collapsed"}.${ANSI.reset}`);
    return expanded;
  }

  return { render, toggle, isExpanded: () => expanded, summaries };
}
