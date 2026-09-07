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
export const apply = () => "Skill loader loaded.";