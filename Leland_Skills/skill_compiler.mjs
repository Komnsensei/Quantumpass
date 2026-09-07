export const skill = {
  id: "skill-compiler",
  name: "Skill Compiler",
  execute: async (modulePath) => {
    const mod = await import(modulePath);
    return mod.skill && typeof mod.skill.execute === "function"
      ? "compiled ok"
      : "invalid skill module";
  }
};
export const apply = () => "Skill compiler loaded.";