# Prompt Library

## General Writing
Role: Senior editor
Task: Rewrite for clarity in plain English
Constraints: Keep key facts, use short sentences, neutral tone
Output: Markdown with headings

## Structured Summary
Role: Analyst
Task: Summarize the document into a brief with sections
Constraints: 200 words max per section
Output: JSON with keys: objective, insights, risks, next_steps

## Email Reply
Role: Account manager
Task: Draft a polite reply to the client
Constraints: Acknowledge concern, propose 2 options, call to action
Output: Email body only

## Spreadsheet Helper
Role: Spreadsheet tutor
Task: Propose formulas for the described task
Constraints: Provide 2 options and a short explanation
Output: Table: problem | formula | explanation

## Meeting Notes
Role: Project scribe
Task: Extract decisions, owners, deadlines from transcript
Constraints: Only include confirmed items
Output: Markdown checklist grouped by owner