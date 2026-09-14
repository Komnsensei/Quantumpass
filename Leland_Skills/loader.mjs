import { daemon } from "./Leland_Kernel_Daemon.mjs";

export const skill = {
  id: "skill-loader",
  name: "Skill Loader",
  execute: async (name) => {
    const mod = await import(`./${name}`);
    return {
      id: mod.skill.id,
      name: mod.skill.name,
      executable: typeof mod.skill.execute === "function"
    };
  }
};

export async function bootBroBrain() {
  console.log("[BRO-BRAIN] Booting kernel and verifying session...");
  if (typeof daemon.boot === "function") {
    await daemon.boot();
  }
  return "Bro Brain online and session verified.";
}

export const apply = () => "Skill loader loaded.";