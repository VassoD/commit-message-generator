# Commit Message Generator

An AI-powered CLI tool for generating concise, meaningful, and conventional git commit messages based on your staged changes. This tool supports both Cohere AI (free tier available) and Deepseek AI (paid, better performance) to analyze your changes and output standardized commit messages that follow the conventional commit format.

> **Note**: All commits in this repository are currently AI-generated using this tool, serving as a real-world demonstration of its capabilities and performance history.

## Features ✨

- AI-powered commit message generation with choice of providers:
  - Cohere AI (free tier available, default)
  - Deepseek AI (paid, better performance)
- Adheres to the conventional commits format
- Provides detailed change statistics
- Works seamlessly with any git repository

## Prerequisites 📋

- Node.js >= 16
- Git installed and configured
- One of the following API keys:
  - Cohere API key (free tier available at [cohere.com](https://cohere.com))
  - Deepseek API key (paid, available at [deepseek.ai](https://deepseek.ai))

## Installation 🚀

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/commit-message-generator.git
   ```

2. Install dependencies:

   ```bash
   cd commit-message-generator
   npm install
   ```

3. Set up your API keys:

   ```bash
   # Create a .env file and add your API key(s)
   # For Cohere (free tier, default)
   echo "COHERE_API_KEY=your-cohere-key-here" > .env
   # For Deepseek (paid, optional)
   echo "DEEPSEEK_API_KEY=your-deepseek-key-here" >> .env
   ```

4. Install globally:

   ```bash
   npm install -g .
   ```

## Usage 🛠️

First, stage your changes:

```bash
git add .  # or specific files
```

Then, generate a commit message using one of these options:

1. Basic usage (uses Cohere by default):

```bash
commit-gen
```

2. Using Deepseek provider:

```bash
commit-gen --provider deepseek
# or shorter
commit-gen -p deepseek
```

3. With detailed statistics:

```bash
# With Cohere (default)
commit-gen --detailed

# With Deepseek
commit-gen --detailed --provider deepseek
```

Example outputs:

```bash
$ commit-gen
Suggested commit message:
feat(auth): add user authentication

$ commit-gen --detailed --provider deepseek
Suggested commit message:
fix(api): resolve bugs in endpoint validation
Change statistics:
Files changed: 3
Lines added: 45
Lines deleted: 12
```

## Development 👩‍💻

1. Clone the repo
2. Install dependencies:

```bash
npm install
```

3. Create your .env file with at least one provider:

```bash
# For Cohere (free tier, default)
echo "COHERE_API_KEY=your-cohere-key" > .env
# For Deepseek (paid, optional)
echo "DEEPSEEK_API_KEY=your-deepseek-key" >> .env
```

4. Link the package locally:

```bash
npm link
```

5. Make your changes
6. Test with:

```bash
commit-gen  # for Cohere
# or
commit-gen --provider deepseek  # for Deepseek
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## License 📄

MIT

## Support 💬

If you have any questions or run into issues, please open an issue in the GitHub repository.

## Tips 💡

- Stage related changes together for more coherent commit messages
- Use `git add -p` to stage specific chunks for more focused commits
- If you don't like a generated message, just run the command again
- The more context in your changes, the better the message will be
- Try both providers to see which gives better results for your use case
