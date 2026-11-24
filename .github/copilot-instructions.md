# Taskflow AI — Copilot instructions

## Project context

Taskflow AI is one independent full-stack application evolving an existing task-management product with additional AI capabilities.

- **Frontend:** Vue 3, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, Node.js, TypeScript
- **Database:** PostgreSQL, Knex.js, Objection.js
- **Authentication:** Existing JWT authentication

Existing domains include user authentication and management, projects, project membership, tasks, comments, and personal tasks. Future AI capabilities may include LLM-backed conversations, conversation management, structured outputs, tool/function calling, AI-assisted project and task operations, evaluation, and monitoring.

## Architecture principles

- Preserve and extend existing application behavior, business logic, and conventions wherever appropriate.
- Add AI functionality through dedicated backend modules with clear responsibilities between controllers, services, DTOs, and modules.
- Keep external LLM calls and credentials on the backend. Never expose API keys or secrets in frontend code.
- Reuse existing application services and authorization rules for AI-assisted operations.
- Treat all LLM output and tool arguments as untrusted input. Validate them on the backend and enforce authorization before taking action.
- Never let an LLM bypass backend validation, permissions, or business rules.
- Add AI-specific persistence only when required by the feature.
- Avoid unnecessary infrastructure, dependencies, abstractions, and breaking changes. Discuss breaking changes before implementing them.

## Development guidelines

- Prefer TypeScript and existing project patterns, naming, formatting, and validation helpers.
- Keep changes focused, readable, maintainable, and appropriately modular.
- Include explicit, useful error handling; do not silently swallow failures or return success-shaped fallbacks.
- Explain significant architectural decisions and any intentional behavior changes.
- Add focused tests for new or changed behavior, and run the smallest relevant existing checks.
- Do not install or remove dependencies unless the task requires it.
- Never expose secrets or commit environment files. Do not change environment variables unless requested.
- Do not run destructive database operations, including migrations that can alter or remove data, without explicit approval.

## Working process

- For substantial changes, inspect relevant code and call sites, then propose an implementation plan before editing.
- Make precise changes within the requested scope and keep dependent call sites consistent.
- After implementation, summarize what changed and report tests or checks performed, including any that could not be run.
- Do not automatically commit or push Git changes.
- When explaining or modifying code, help developers understand the reasoning behind the implementation rather than providing code changes without explanation.
- Prefer incremental implementation steps over large, unrelated changes.
