# CI/CD Standards (Template)

## Overview
This document outlines the standard CI/CD pipeline and workflow for this repository.
All code changes should flow through Pull Requests (PRs) and pass automated checks.

## Branch Conventions
- `feature/<name>` — New features
- `bugfix/<name>` — Bug fixes
- `hotfix/<name>` — Urgent production fixes
- `main` — Protected branch, requires PR + passing CI checks

## Commit Message Convention (Conventional Commits)
```
feat: add new login feature
fix: resolve null pointer exception
docs: update readme
refactor: simplify authentication logic
test: add unit tests for user service
chore: update dependencies
style: fix formatting
perf: improve database query speed
```

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `gemini-review.yml` | PR opened/synchronized | AI-powered code review using Gemini Code Assist |
| `jules-autonomous.yml` | `workflow_dispatch` | Trigger Jules AI to fix bugs or implement features |
| `gemini-jules-bridge.yml`| PR Review | Forwards Gemini review comments to Jules for auto-fixing |

*Note: Additional workflows (Linting, Testing) should be added based on the project language (e.g., Python, Node.js).*

## AI Integration Flow
1.  **Trigger**: A human triggers Jules via `workflow_dispatch` (or by labeling an issue `jules:fix`).
2.  **Execution**: Jules analyzes the task, writes code, and opens a Pull Request.
3.  **Review**: Gemini Code Assist automatically reviews the PR against `.gemini/styleguide.md`.
4.  **Feedback Loop**: If Gemini finds violations, `gemini-jules-bridge.yml` posts them as comments for Jules.
5.  **Refinement**: Jules reads the feedback and pushes fixes.
6.  **Merge**: A human reviewer gives final approval and merges.

## Required Secrets (GitHub Actions)
Ensure these secrets are set in your repository:
- `GEMINI_API_KEY`: For Gemini Code Assist (if using the action, though the App is preferred).
- `GCP_PROJECT_ID`: For Jules/GCP integration.
- `GCP_SERVICE_ACCOUNT_KEY`: For Jules/GCP integration.

## Quality Gates
Before merging, ensure:
- [ ] All CI/CD checks pass.
- [ ] No unresolved "Critical" or "High" severity issues from Gemini Review.
- [ ] Tests pass (if applicable).
