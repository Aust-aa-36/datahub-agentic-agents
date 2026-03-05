# AI CI/CD Template Repository

This repository serves as the "Gold Standard" template for initializing new projects with a fully integrated, autonomous AI development toolchain.

## 🚀 Integrated Toolchain

This repository is pre-configured with the following:

### 1. Autonomous Coding (Jules)
- **Workflow**: `.github/workflows/jules-autonomous.yml`
- **Trigger**: Creating a GitHub issue with the `jules:fix` label.
- **Outcome**: Jules analyzes the issue, implements a fix, runs tests, and opens a Pull Request.

### 2. AI Code Review (Gemini Code Assist)
- **Workflow**: `.github/workflows/gemini-review.yml`
- **Reviewer**: Gemini Code Assist (GitHub SCM App).
- **Trigger**: Any Pull Request opened or synchronized.
- **Outcome**: Automated, inline code reviews based on the `.gemini/styleguide.md`.

### 3. The Bridge (Gemini → Jules)
- **Workflow**: `.github/workflows/gemini-jules-bridge.yml`
- **Feedback Loop**: Automatically forwards Gemini's review violations to Jules as a structured comment.
- **Outcome**: Jules acts on the feedback and pushes a follow-up commit autonomously.

### 4. Conductor Orchestration
- **Folder**: `conductor/`
- **Guideline**: Defines the expert skill orchestration for Planning, Design, Implementation, and Review phases.

## 🛠️ Usage

To initialize a new repository using this template:

1.  Clone this repository or use it as a GitHub Template.
2.  Use the **`ai-cicd-setup`** skill from the [Global Skills](https://github.com/Aust-aa-36/global-skills) repository to automate the setup of labels and orchestration.
3.  Ensure the **Jules** and **Gemini Code Assist** GitHub Apps are installed on the new repo.

## ⚖️ Standards
- **Styleguide**: `.gemini/styleguide.md`
- **CI/CD Standards**: `.gemini/skills/cicd-standards.md`
