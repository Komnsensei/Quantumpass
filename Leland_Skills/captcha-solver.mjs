import { execSync } from "child_process";
export const skill = {
  id: "captcha-solver",
  name: "Captcha Solver",
  execute: async (imagePath) =>
    execSync(`tesseract "${imagePath}" stdout`).toString().trim()
};
export const apply = () => "Captcha solver loaded.";