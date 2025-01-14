// src/generator.js
import { getDiffSummary, getStagedFiles } from "./utils/git.js";
import { generateAICommitMessage } from "./utils/ai-formatter.js";

export class CommitMessageGenerator {
  constructor(options = {}) {
    this.options = options;
  }

  async run() {
    try {
      // Check if there are any staged changes
      const diffStats = await getDiffSummary();
      const stagedFiles = await getStagedFiles();

      if (diffStats.additions === 0 && diffStats.deletions === 0) {
        console.log(
          "\nNo staged changes found. Please stage your changes using git add first."
        );
        return;
      }

      // Generate AI commit message with specified provider
      const message = await generateAICommitMessage(this.options.provider);

      if (message) {
        console.log("\nSuggested commit message:");
        console.log(message);

        if (this.options.detailed) {
          this.displayDetailedStats(diffStats, stagedFiles);
        }
      } else {
        console.log(
          "\nFailed to generate commit message. Please try again or write your message manually."
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  displayDetailedStats(diffStats, stagedFiles) {
    console.log("\nChange statistics:");
    console.log(`Files changed: ${stagedFiles.length}`);
    console.log(`Lines added: ${diffStats.additions}`);
    console.log(`Lines deleted: ${diffStats.deletions}`);

    if (stagedFiles.length > 0) {
      console.log("\nChanged files:");
      stagedFiles.forEach((file) => console.log(`  • ${file}`));
    }
  }
}
