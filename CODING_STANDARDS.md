# Coding Standards

Read by `/code-review`'s Standards axis. Each rule cites the ADR that ratified
it — the ADR carries context and rejected alternatives; this file carries only
the appliable rule.

## Comments
- If you need a paragraph-long comment to justify why the workaround is OK, the code is wrong - fix the code.

- **A comment exists only where the code can't explain itself**

#### When comment is needed:
- **Comments cite only stable anchors** — a GitHub issue number, a
  failure-class code, a decision code, or an ADR. Never a
  plan/spec path, task number, or finding label.
- **No unbacked attributions** — "user decision" appears only with an issue
  number as evidence.

## Module structure

- **No stage module imports a sibling stage** — shared behaviour hoists into a
  non-stage primitive.

## Implementation
- prefer maintainable and scalable implementation solutions