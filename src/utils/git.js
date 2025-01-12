// src/utils/git.js
import { execSync } from "child_process";

export const getGitStatus = () => {
  try {
    const output = execSync("git status --porcelain").toString();
    return output.split("\n").filter((line) => line.length > 0);
  } catch (error) {
    throw new Error("Not a git repository or git is not installed");
  }
};

export const getDiffSummary = () => {
  try {
    const diff = execSync("git diff --staged").toString();
    return {
      additions: (diff.match(/^\+(?!\+\+)/gm) || []).length,
      deletions: (diff.match(/^-(?!--)/gm) || []).length,
    };
  } catch (error) {
    return { additions: 0, deletions: 0 };
  }
};

export const getStagedFiles = () => {
  try {
    const output = execSync("git diff --staged --name-only").toString();
    return output.split("\n").filter(Boolean);
  } catch (error) {
    return [];
  }
};
