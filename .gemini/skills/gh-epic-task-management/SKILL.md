---
name: gh-epic-task-management
description: Automated creation and linking of GitHub Epics and sub-tasks. Use when breaking down an implementation plan into feature-rich GitHub issues with a parent-child relationship.
---

# GitHub Epic & Task Management

Use this skill to create a hierarchy of GitHub issues (Epics and Tasks) and link them using the native sub-issues feature.

## Workflow

1.  **Extract Tasks**: Identify the Epic and individual tasks from the provided plan.
2.  **Create Epic**: 
    - Use \`gh issue create\` with a title and body following the project's \`feature_request.yml\` template.
    - Tag the Epic with the \`enhancement\` label.
    - Capture the Epic's **Global Node ID** using \`gh issue view <epic_number> --json id --jq .id\`.
3.  **Create Tasks**:
    - For each task in the plan, use \`gh issue create\`.
    - Capture each task's **Global Node ID** using \`gh issue view <task_number> --json id --jq .id\`.
    - **Link to Epic**: Use the bundled script: \`node scripts/add_sub_issue.cjs <epic_id> <task_id>\`.
4.  **Update Epic Body**:
    - Edit the Epic's body to include a task list (e.g., \`- [ ] #123 Task Title\`) for visible progress tracking in the UI.

## Implementation Details

- **Feature-Rich Body**: Ensure each issue body follows the structure of \`.github/ISSUE_TEMPLATE/feature_request.yml\` where possible.
- **Project Board**: Add both the Epic and all tasks to the relevant GitHub Project board using the \`--project\` flag in \`gh issue create\`.
- **Linking**: Always use the GraphQL-based \`addSubIssue\` mutation (via the bundled script) to ensure the native parent-child relationship is established.

## Bundled Resources

- **scripts/add_sub_issue.cjs**: Automates the GraphQL mutation for linking sub-issues to a parent.
