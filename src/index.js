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
  .parse(process.argv);

const options = program.opts();

// Create and run the generator
const generator = new CommitMessageGenerator(options);
generator.run().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
