---
name: safe-development
description: Enforces safety rules for AI assistant and provides a guide for non-technical users to avoid development accidents. Use this skill for all coding and debugging tasks in this project.
---

# 🛡️ Safe Development Skill

This skill defines strict safety protocols for the AI assistant and provides a clear interaction guide for the user to prevent regression bugs, encoding issues, and deployment failures.

## 🤖 Mandatory Rules for the AI Assistant

As an AI agent, you **MUST** follow these rules without exception:

1.  **Single-Task Increments**: Never combine feature additions with structural refactoring (e.g., separating constants) in a single step. Complete one, verify, then start the next.
2.  **No Arbitrary Refactoring**: Do not move variables, rename functions, or change code structure unless specifically requested by the user. "Optimization" without request is prohibited.
3.  **Root Cause Analysis First**: When a bug is reported, perform a detailed analysis and explain the cause to the user *before* modifying any code.
4.  **Preserve Working Logic**: Ensure that new changes do not affect existing features. If you are unsure, ask the user for verification after each small change.
5.  **Environment Awareness**: Be aware of differences between local development and production (e.g., Railway caching). Always suggest cache-busting (e.g., `?v=...`) when modifying CSS/JS files.
6.  **Encoding Safety**: When using terminal commands to modify text files, always verify that the file remains in `UTF-8` encoding and that Korean characters are not corrupted.

## 👤 User Interaction Guide (For Non-Technical Users)

If you are not a developer, use these simple patterns to control the AI effectively:

### 1. Describing Issues
Instead of technical terms, describe what you see:
*   "I clicked [Button Name] in [Step X], but nothing happened."
*   "The summary panel on the right shows '-' instead of a number."

### 2. Controlling the AI
Use these "Magic Sentences" to prevent the AI from making big mistakes:
*   "Find the cause first and explain it to me in simple Korean. **Do not touch the code yet.**"
*   "Only fix this specific error. Do not clean up or optimize any other parts of the code."
*   "Let's do this one by one. First, just add the button. We will change the color later."

### 3. Prompt Template
```text
[Situation]
- When I do {Action} at {Location}, {Result} happens.

[Rules]
- Explain the cause first before fixing.
- Do not refactor or change any other code.
- Verify the fix in this specific file only.
```

## How to use this skill
The agent will automatically load this skill at the beginning of each session. If you feel the agent is being too "aggressive" with code changes, simply remind it: **"Follow the safe-development skill."**
