---
name: git-commit
description: Generates a conventional commit message from staged changes — past-tense English verbs, bulleted body — then commits after confirmation.
---

# Git Commit

Analyzes **staged changes only**, builds a conventional commit message per project rules, and commits after confirmation.

## Commit format

```
type(scope): past-tense-verb short summary

- past-tense-verb specific detail
- past-tense-verb specific detail
```

**Mandatory rules:**
- Language — strictly **English**. B2-level vocabulary
- Verbs — **past tense**: `created`, `added`, `fixed`, `removed`, `updated`, `refactored`, `moved`, `renamed`, `deleted`, `implemented`, `extracted`, `configured`, `changed`, `replaced`, `improved`
- `type` — one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- `scope` — optional, only if it adds meaning (e.g. `auth`, `api`, `adr`); without scope — `type: verb summary`
- Title — concise, up to 72 chars
- Body — bulleted list (`-`), each item starts with a past-tense verb
- Body is **required** if more than one file is affected or the change is non-trivial
- Body is **not needed** if the change is a single file and the title fully describes it
- Body is **terse**: max 4 items, one item = one logical action, not one file
  - Group similar changes into one item (e.g. several new ADR files → one item `added ADR files for X, Y, Z`, not one item per file)
  - Don't list files line by line — describe the essence of the change, not a path list
  - Don't repeat in the body what the title already says
  - If grouping leaves one item that just duplicates the title, drop the body entirely

**Examples:**

```
docs: created initial docs/ structure for docs-as-code pattern
- created ENTITIES.md
- created mock decision files for ADR pattern
```

```
feat(auth): added JWT token refresh endpoint
- added POST /auth/refresh route handler
- added token validation middleware
- updated AuthService with refreshToken method
```

```
fix: removed duplicate index on users table
```

## Pipeline

Follow the steps strictly in order.

---

### Step 1. Check staged changes

Run both commands:

```bash
git status --short
git diff --staged
```

If there are **no** staged changes (`git diff --staged` output is empty) — report:
> No staged changes. Add files with `git add <file>` and call the skill again.

Stop. Don't analyze unstaged changes.

---

### Step 2. Build the commit message

Based on `git diff --staged`:

1. Determine the **type**: what kind of change is it — new feature, fix, docs, refactor?
2. Determine the **scope** (if relevant): which area of the system is affected?
3. Write the **title**: `type(scope): verb summary` or `type: verb summary` — concise, up to 72 chars
4. Build the **body**: group changes by meaning and describe each group in one item (max 4 items, no file listing)

Type selection rule:
- `feat` — new functionality for a user/system
- `fix` — bug fix
- `docs` — documentation-only changes
- `refactor` — refactoring with no functional change
- `chore` — maintenance: dependencies, configs, scripts
- `test` — added or changed tests
- `style` — formatting, whitespace (no logic change)
- `ci` — CI/CD pipeline changes
- `build` — build system changes

---

### Step 3. Show the message and ask for confirmation

Print the proposed commit in a code block and ask:

```
Proposed commit:

───────────────────────────────────
docs: created initial docs/ structure
- created ENTITIES.md
- created mock decision files for ADR pattern
───────────────────────────────────

Commit it? [yes / no / edit]
```

User response options:
- **yes** / **y** / **да** — proceed to Step 4
- **no** / **n** / **нет** — stop, don't commit, report that the operation was cancelled
- **edit** / any clarification — apply the edits, adjust the message, show it again

---

### Step 4. Commit

Run `git commit` with a multiline message via HEREDOC:

```bash
git commit -m "$(cat <<'COMMIT_MSG'
type(scope): verb summary

- verb detail 1
- verb detail 2
COMMIT_MSG
)"
```

After running:
- If the commit succeeded — print the hash and the first line of the message
- If the commit failed (pre-commit hook, error) — print the error text and **don't** retry the commit; tell the user what needs fixing
