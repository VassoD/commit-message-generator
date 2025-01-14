import { execSync } from "child_process";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check for Deepseek API key
if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error("DEEPSEEK_API_KEY is not set in environment variables");
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export const generateAICommitMessage = async () => {
  try {
    const stagedDiff = execSync("git diff --staged").toString();
    const filesChanged = execSync("git diff --staged --name-only").toString();

    const prompt = `
    Generate a conventional commit message that precisely describes the code changes. Follow these comprehensive guidelines for a high-quality commit message:

    Core Rules:
    1. Subject line (first line) MUST:
       - Be 50 characters or less
       - Start with type(scope): format
       - Use imperative mood ("add" not "added" or "adds")
       - Start with lowercase
       - No period at the end
       - Describe WHAT the change does, not HOW

    Type Categories (must be one of):
    - feat: New feature or significant enhancement that adds functionality
    - fix: Bug fix or error correction
    - docs: Documentation changes only (README, comments, etc.)
    - style: Changes that don't affect code meaning (whitespace, formatting, etc.)
    - refactor: Code changes that neither fix bugs nor add features
    - test: Adding/modifying test cases
    - chore: Maintenance tasks (dependency updates, build changes, etc.)

    Important Type Selection Rules:
    - For changes to the AI prompt/rules: Always use "refactor" as it improves core functionality
    - For formatting only: use "style"
    - For new capabilities: use "feat"
    - When improving existing behavior: use "refactor"

    Scope Guidelines:
    - Use lowercase
    - Be specific to the changed component/module
    - Use short but meaningful terms
    - Examples: api, auth, core, ui, utils, tests
    - For multiple areas, use the most important one

    Description Best Practices:
    - Be specific and precise
    - Focus on the WHY and WHAT, not the HOW
    - Mention key technical details when relevant
    - Use technical terms accurately
    - Reference issue numbers if applicable

    Examples of Excellent Commits:
    - feat(auth): implement oauth2 login flow
    - fix(api): handle undefined user responses
    - refactor(core): simplify data processing pipeline
    - docs(readme): add deployment instructions
    - style(ui): align form elements consistently
    - test(utils): add unit tests for date formatter
    - chore(deps): update dependencies to latest versions

    Files changed:
    ${filesChanged}

    Exact changes:
    ${stagedDiff.slice(0, 3000)}

    Respond ONLY with the commit message in the specified format, including specific details like numerical changes.
    `;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a commit message generator that follows conventional commit format strictly.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.05,
        stop: ["\n"],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Deepseek API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Raw response from model:", data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Deepseek API");
    }

    let message = data.choices[0].message.content.trim();

    console.log("Raw message from model:", message);

    // Enhanced cleanup of AI artifacts
    message = message
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\s*\([^)]*\)\s*$/, "") // Remove trailing parentheses with content
      .replace(
        /^(.*?)(\([^)]+\))/,
        (_, type, scope) => `${type}${scope.toLowerCase()}`
      ) // Convert scope to lowercase
      .trim();

    console.log("Cleaned message:", message);

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
    /^(feat|fix|docs|style|refactor|test|chore)\([a-zA-Z0-9-_/.]+\): [a-zA-Z0-9- _.,]+$/;
  return conventionalCommitRegex.test(message);
};
