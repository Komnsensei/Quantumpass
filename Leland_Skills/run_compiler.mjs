export const skill = {
  id: "run-compiler",
  name: "Run Compiled Skill",
  execute: async (modulePath, ...args) => (await import(modulePath)).skill.execute(...args)
};
export const apply = () => "Run compiler loaded.";