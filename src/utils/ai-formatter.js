// src/utils/ai-formatter.js
import { execSync } from "child_process";
import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Cohere client with API key from environment variables
if (!process.env.COHERE_API_KEY) {
  throw new Error("COHERE_API_KEY is not set in environment variables");
}

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export const generateAICommitMessage = async () => {
  try {
    const stagedDiff = execSync("git diff --staged").toString();
    const filesChanged = execSync("git diff --staged --name-only").toString();

    const prompt = `
        Analyze these git changes and generate ONE precise commit message.
        Focus on exactly what was modified in the code.

        FORMAT (EXACTLY AS SHOWN):
        type(scope): specific_change_description

        TYPES (use one):
        - feat: New features
        - fix: Bug fixes
        - refactor: Code improvements
        - docs: Documentation
        - style: Formatting only
        - test: Test changes
        - chore: Maintenance

        SCOPE:
        - Must be in parentheses
        - Use exact directory name from changed files
        - Example: feat(utils): or fix(api):

        DESCRIPTION:
        - Describe the EXACT change made
        - Be specific about what was modified
        - Keep it under 50 chars
        - No period at end

        GOOD EXAMPLES:
        refactor(prompt): restructure AI instruction format
        fix(cleanup): add missing parentheses handling
        docs(format): update commit message examples

        BAD EXAMPLES:
        refactor(utils): improve functionality
        fix(api): update code
        style: make changes

        FILES CHANGED:
        ${filesChanged}

        CHANGES:
        ${stagedDiff.slice(0, 1500)}

        IMPORTANT: Return ONLY a single-line commit message that precisely describes the actual code changes made.`;

    const response = await cohere.generate({
      prompt: prompt,
      maxTokens: 50,
      temperature: 0.1,
      k: 0,
      p: 0.75,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
      stopSequences: ["\n"],
      returnLikelihoods: "NONE",
    });

    if (!response.generations || response.generations.length === 0) {
      throw new Error("No response from Cohere API");
    }

    let message = response.generations[0].text.trim();

    // Enhanced cleanup of AI artifacts
    message = message
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/^.*here is a suggested conventional commit message:\s*/i, "") // Remove verbose preamble
      .replace(/^commit message:?\s*/i, "") // Remove "commit message:" prefix
      .replace(/^I suggest:?\s*/i, "") // Remove "I suggest" prefix
      .replace(/^suggested commit:?\s*/i, "") // Remove "suggested commit" prefix
      .replace(/\.$/, "") // Remove trailing period
      .replace(/[(*)]/g, "") // Remove asterisks and parentheses at the end
      .replace(/\/+/g, "-") // Replace slashes with hyphens in scope
      .replace(/^[^a-z]+/i, "") // Remove any non-letter characters from start
      .replace(/([a-z]+)([A-Z][a-z]+)/g, "$1-$2") // Add hyphen between camelCase words
      // Fix scope formatting
      .replace(/^(feat|fix|docs|style|refactor|test|chore)([a-z]+)/, "$1($2)") // Add missing parentheses
      .toLowerCase() // Ensure lowercase
      .trim();

    // Validate the message follows conventional commit format
    if (!isValidCommitMessage(message)) {
      console.log("\nInvalid message generated:", message);
      throw new Error(
        "Generated message does not follow conventional commit format"
      );
    }

    return message;
  } catch (error) {
    console.error("Error generating AI commit message:", error.message);
    return null;
  }
};

// Utility function to validate commit message format
const isValidCommitMessage = (message) => {
  const conventionalCommitRegex =
    /^(feat|fix|docs|style|refactor|test|chore)(\([a-z0-9-]+\))?: [a-z].+/;
  return conventionalCommitRegex.test(message);
};
