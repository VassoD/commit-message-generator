import { execSync } from "child_process";
import fetch from "node-fetch";
import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config();

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const PERFORMANCE_LOG_FILE = "model_performance.jsonl";

// Initialize Cohere client if API key is available
let cohereClient = null;
if (process.env.COHERE_API_KEY) {
  cohereClient = new CohereClient({
    token: process.env.COHERE_API_KEY,
  });
}

const logPerformance = async (data) => {
  try {
    const logEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      git_hash: execSync("git rev-parse HEAD").toString().trim(),
      files_changed: execSync("git diff --staged --name-only")
        .toString()
        .split("\n")
        .filter(Boolean),
    };

    await fs.appendFile(PERFORMANCE_LOG_FILE, JSON.stringify(logEntry) + "\n");
  } catch (error) {
    console.error("Failed to log performance:", error);
  }
};

const generateWithCohere = async (prompt) => {
  if (!cohereClient) {
    throw new Error("Cohere API key not configured");
  }

  const startTime = Date.now();
  try {
    const response = await cohereClient.generate({
      prompt: prompt,
      maxTokens: 50,
      temperature: 0.05,
      stopSequences: ["\n"],
    });

    if (!response.generations || response.generations.length === 0) {
      throw new Error("No response from Cohere API");
    }

    const message = response.generations[0].text.trim();
    const duration = Date.now() - startTime;

    await logPerformance({
      provider: "cohere",
      duration_ms: duration,
      success: true,
      tokens_used: response.generations[0].tokens || 0,
      message,
    });

    return message;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logPerformance({
      provider: "cohere",
      duration_ms: duration,
      success: false,
      error: error.message,
    });
    throw error;
  }
};

const generateWithDeepseek = async (prompt) => {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Deepseek API key not configured");
  }

  const startTime = Date.now();
  try {
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
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Deepseek API");
    }

    const message = data.choices[0].message.content.trim();
    const duration = Date.now() - startTime;

    await logPerformance({
      provider: "deepseek",
      duration_ms: duration,
      success: true,
      tokens_used: data.usage?.total_tokens || 0,
      message,
    });

    return message;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logPerformance({
      provider: "deepseek",
      duration_ms: duration,
      success: false,
      error: error.message,
    });
    throw error;
  }
};

export const generateAICommitMessage = async (preferredProvider = "cohere") => {
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

    // Try preferred provider first, then fallback
    let message;
    let usedFallback = false;
    let finalProvider = preferredProvider;

    try {
      message = await (preferredProvider === "deepseek"
        ? generateWithDeepseek(prompt)
        : generateWithCohere(prompt));
    } catch (error) {
      console.log(`Failed with ${preferredProvider}, trying fallback...`);
      usedFallback = true;
      finalProvider = preferredProvider === "deepseek" ? "cohere" : "deepseek";
      message = await (preferredProvider === "deepseek"
        ? generateWithCohere(prompt)
        : generateWithDeepseek(prompt));
    }

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
    const isValid = isValidCommitMessage(message);
    if (!isValid) {
      console.log("\nInvalid message generated:", message);
      await logPerformance({
        provider: finalProvider,
        used_fallback: usedFallback,
        message_valid: false,
        final_message: message,
        validation_error: "Does not follow conventional commit format",
      });
      throw new Error(
        "Generated message does not follow conventional commit format"
      );
    }

    await logPerformance({
      provider: finalProvider,
      used_fallback: usedFallback,
      message_valid: true,
      final_message: message,
    });

    return message;
  } catch (error) {
    console.error("Error generating AI commit message:", error.message);
    return null;
  }
};

// Utility function to validate commit message format
const isValidCommitMessage = (message) => {
  const conventionalCommitRegex =
    /^(feat|fix|docs|style|refactor|test|chore)\([a-zA-Z0-9-_/.]+\): [a-zA-Z0-9- _.,@/]+$/;
  return conventionalCommitRegex.test(message);
};
