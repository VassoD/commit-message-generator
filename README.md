# Commit Message Generator

An AI-powered CLI tool for generating concise, meaningful, and conventional git commit messages based on your staged changes. This tool uses Cohere AI to analyze your changes and output standardized commit messages that follow the conventional commit format.

## Features ✨

- AI-powered commit message generation
- Adheres to the conventional commits format
- Provides detailed change statistics
- Works seamlessly with any git repository

## Prerequisites 📋

- Node.js >= 16
- Git installed and configured
- A Cohere API key (free tier available at [cohere.com](https://cohere.com))
  - See [rate limits documentation](https://docs.cohere.com/docs/rate-limits)
  - Can be replaced with other AI models by modifying the formatter

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

3. Set up your Cohere API key:

   ```bash
   # Create a .env file and add your API key
   echo "COHERE_API_KEY=your-api-key-here" > .env
   ```

4. Install globally:

   ```bash
   npm install -g .
   ```

## Usage 🛠️

To generate a commit message:

1. Stage your changes:

   ```bash
   git add .
   ```

2. Generate a commit message:

   ```bash
   commit-gen
   ```

To view detailed statistics along with the commit message:

```bash
commit-gen --detailed
```

Example outputs:

```bash
$ commit-gen
Suggested commit message:
feat(auth): add user authentication

$ commit-gen --detailed
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

3. Create your .env file:

```bash
echo "COHERE_API_KEY=your-api-key" > .env
```

4. Link the package locally:

```bash
npm link
```

5. Make your changes
6. Test with:

```bash
commit-gen
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
