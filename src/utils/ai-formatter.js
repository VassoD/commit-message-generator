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
    Generate a conventional commit message based on the exact code changes in the diff. The type should accurately represent the nature of the change, and the description should precisely describe what was modified. Ensure the type accurately reflects the nature of the change: use 'chore' for maintenance tasks, 'feat' for new features, 'fix' for bug fixes, etc. Be specific in the description: mention exactly what was changed, including any numerical values or code elements affected.
    
    Format: type(scope): description
    
    Types:
    - feat: new features
    - fix: bug fixes
    - docs: documentation
    - style: formatting
    - refactor: code restructuring
    - test: testing
    - chore: maintenance
    
    Examples:
    - feat(user/auth): add login functionality
    - fix(database/connection): resolve connection issues
    
    Files changed:
    ${filesChanged}
    
    Exact changes:
    ${stagedDiff.slice(0, 1500)}
    
    Respond ONLY with the commit message in the specified format, including specific details like numerical changes.
    `;

    const response = await cohere.generate({
      prompt: prompt,
      maxTokens: 100,
      temperature: 0.0,
      stopSequences: ["\n"],
    });

    console.log(response);

    if (!response.generations || response.generations.length === 0) {
      throw new Error("No response from Cohere API");
    }

    let message = response.generations[0].text.trim();

    // Enhanced cleanup of AI artifacts
    message = message
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(
        /^(Here is|Here's|I suggest|Suggested|Commit message|A commit message|The commit message|You can use|Consider this|Try this|Perhaps|Maybe|Suggestion|Recommendation|Proposal|uggestion|Proposal):?\s*/i,
        ""
      ) // Remove verbose preamble
      .replace(/\.$/, "") // Remove trailing period
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
    /^(feat|fix|docs|style|refactor|test|chore)\([a-z0-9-\/]+\): [a-zA-Z0-9- _.,]+$/;
  return conventionalCommitRegex.test(message);
};
