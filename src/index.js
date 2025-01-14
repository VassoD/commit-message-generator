import { Command } from "commander";
import dotenv from "dotenv";
import { CommitMessageGenerator } from "./generator.js";

// Load environment variables
dotenv.config();

const program = new Command();

program
  .version("1.0.0")
  .description(
    "Generate meaningful git commit messages based on your changes using AI"
  )
  .option("-d, --detailed", "Show detailed statistics")
  .option(
    "-i, --interactive",
    "Interactive mode - choose from multiple suggestions"
  )
  .option(
    "-p, --provider <provider>",
    "AI provider to use (cohere or deepseek)",
    "cohere"
  )
  .parse(process.argv);

const options = program.opts();

// Validate provider option
if (options.provider && !["cohere", "deepseek"].includes(options.provider)) {
  console.error("Error: provider must be either 'cohere' or 'deepseek'");
  process.exit(1);
}

// Create and run the generator
const generator = new CommitMessageGenerator(options);
generator.run().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
