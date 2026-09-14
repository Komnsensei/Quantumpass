// Leland Kernel Daemon — Enhanced with Freebuff Integration
import { skill as hotSwap } from "./Leland_Skills/hot_swap.mjs";
// NOTE: getRateLimitsByModel / getFreebuffGateCode were imported here but have
// never been exported by runtime/freebuff-provider.mjs, and nothing in this
// file used them - the unresolvable import broke the whole module. Removed so
// the daemon loads. If rate-limit/gate handling is wanted, add the functions to
// the provider and use them in boot().

export const daemon = {
  name: "Leland Kernel Daemon",
  
  async boot() {
    console.log(`[Leland-Kernel] Initializing Bro Brain session connection...`);
    try {
      const res = await fetch('https://api.quantumpass.org/api/v1/freebuff/session');
      const session = await res.json();

      if (session.status === 'none') {
        console.log(`[Leland-Kernel] No active session found. Requesting new admission...`);
        await fetch('https://api.quantumpass.org/api/v1/freebuff/session', { method: 'POST' });
      } else if (session.status === 'rate_limited') {
        console.warn(`[Leland-Kernel] Rate limit reached. Quota resets at ${session.resetAt}`);
      }
    } catch (err) {
      console.error(`[Leland-Kernel] Failed to verify session state:`, err.message);
    }
  },

  async patch(skillPath) {
    console.log(`[Leland-Kernel] Applying patch from: ${skillPath}`);
    return hotSwap.execute(skillPath);
  }
};

export const apply = async () => {
  await daemon.boot();
  return "Leland Kernel Daemon loaded with Freebuff session bridge.";
};