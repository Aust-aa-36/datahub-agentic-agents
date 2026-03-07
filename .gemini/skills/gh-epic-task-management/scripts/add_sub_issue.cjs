#!/usr/bin/env node

const { execSync } = require('child_process');

function addSubIssue(parentIssueId, subIssueId) {
    const query = `
    mutation($parentIssueId: ID!, $subIssueId: ID!) {
      addSubIssue(input: {issueId: $parentIssueId, subIssueId: $subIssueId}) {
        issue {
          number
          title
        }
      }
    }`;

    try {
        const result = execSync(`gh api graphql -f query='${query}' -f parentIssueId='${parentIssueId}' -f subIssueId='${subIssueId}'`, { encoding: 'utf-8' });
        console.log(`Successfully added sub-issue to parent.`);
        return JSON.parse(result);
    } catch (error) {
        console.error(`Error adding sub-issue: ${error.message}`);
        process.exit(1);
    }
}

const [,, parentId, subId] = process.argv;
if (!parentId || !subId) {
    console.error('Usage: node add_sub_issue.cjs <parent_node_id> <sub_issue_node_id>');
    process.exit(1);
}

addSubIssue(parentId, subId);
