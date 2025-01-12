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
    // Get git diff information
    const stagedDiff = execSync("git diff --staged").toString();
    const filesChanged = execSync("git diff --staged --name-only").toString();

    // Prepare the prompt for Cohere
    const prompt = `
        As an expert developer, analyze these git changes and suggest a concise, meaningful commit message following the conventional commits format.
        The message should be in the format: type(optional-scope): description

        Files changed:
        ${filesChanged}

        Changes:
        ${stagedDiff.slice(0, 1500)} // Limit diff size

        Generate a commit message that:
        1. Uses conventional commit types (feat, fix, docs, style, refactor, test, chore)
        2. Is concise but descriptive
        3. Focuses on the "what" and "why" of the changes
        4. Reads naturally, as a human would write it

        Return only the commit message, nothing else.`;

    // Get AI suggestion
    const response = await cohere.generate({
      prompt: prompt,
      maxTokens: 50,
      temperature: 0.7,
      k: 0,
      stopSequences: ["\n"],
      returnLikelihoods: "NONE",
    });

    if (!response.generations || response.generations.length === 0) {
      throw new Error("No response from Cohere API");
    }

    const message = response.generations[0].text.trim();

    // Validate the message follows conventional commit format
    if (!isValidCommitMessage(message)) {
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
    /^(feat|fix|docs|style|refactor|test|chore)(\([a-z0-9-]+\))?: .+/i;
  return conventionalCommitRegex.test(message);
};
