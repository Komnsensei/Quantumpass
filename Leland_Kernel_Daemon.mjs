// Leland Kernel Daemon — RECONSTRUCTED 2026-09-06 from session 12820 traces
// (original 421b body was lost; rebuilt around the recovered hot-swap skill)
import { skill as hotSwap } from "./Leland_Skills/hot_swap.mjs";

export const daemon = {
  name: "Leland Kernel Daemon",
  async patch(skillPath) {
    console.log(`[Leland-Kernel] Applying patch from: ${skillPath}`);
    return hotSwap.execute(skillPath);
  }
};

export const apply = () => "Leland Kernel Daemon loaded.";