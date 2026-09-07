import { execSync } from 'child_process';

export const skill = {
  id: "shell-exec",
  name: "Host Shell Executor",
  execute: async (command) => {
    try {
      console.log(`[Leland-Kernel] Executing: ${command}`);
      const output = execSync(command, { encoding: 'utf8', shell: true });
      return output || "Command executed successfully.";
    } catch (e) {
      return `Execution error: ${e.message}`;
    }
  }
};

export const apply = () => "Shell executor loaded.";