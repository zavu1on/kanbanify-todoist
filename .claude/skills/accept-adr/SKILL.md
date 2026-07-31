---
name: accept-adr
description: Formats and deeply reviews an ADR file in docs/decisions/ — formats it to match the project template, then audits content quality, consistency with other accepted decisions, and ADR process compliance.
---

# Accept ADR

Takes an ADR file from `docs/decisions/`, brings it to the project template, and runs a strict review.

## Argument

Path to the ADR file, passed via `$ARGUMENTS`. Can be absolute or relative to the repo root.

Call example: `/accept-adr docs/decisions/04-my-decision.md`

## Pipeline

Follow the steps strictly in order, each one is mandatory.

---

### Step 1. Load context

Read all files needed for the work:

1. `docs/decisions/README.md` — template, fields, statuses, criteria for creating an ADR
2. `docs/README.md` — documentation formatting rules (language, indentation, bold/italic/underline)
3. The target ADR file (path from `$ARGUMENTS`)
4. All other files in `docs/decisions/` (except `README.md`) — to check consistency

If the file from the argument doesn't exist — report an error and stop.

---

### Step 2. Formatting

Bring the file's content to the template from `docs/decisions/README.md`. Rules:

**File structure (mandatory order):**
```
# NN. Название решения

**Дата:** YYYY-MM-DD
**Автор:** Имя
**Статус:** Предложено | Принято | Отклонено | Устарело
**Связанные решения:** [NN-название.md](NN-название.md) | —


## Контекст

...


## Решение

...


## Последствия

...
```

**Formatting rules (from `docs/README.md`):**
- Language: Russian
- Double blank line between paragraphs and sections
- Business entities (Организация, Аккаунт, Курс, etc.) — **bold**, capitalized
- DB/code field names — `<u>fieldName</u>`
- Word emphasis — *italic*
- Definitions — **bold**

**What NOT to change while formatting:**
- The meaning and content of the decision — only structure and markup
- The date — if the file has none, extract it from `git log --diff-filter=A --pretty=format:"%ad" --date=short -- <file>`
- The author — if missing, take it from `git log --pretty=format:"%an" -1 -- <file>`
- The status — if missing, set `Предложено`

Write the updated file.

---

### Step 3. Review

After formatting, run a strict review against each criterion. Don't soften scores — flagging a weak spot beats missing it.

#### 3.1 Template compliance

- [ ] All mandatory fields present and filled in (not empty, not `—` where a value is required)
- [ ] Status is valid: `Предложено | Принято | Отклонено | Устарело`
- [ ] The NN number in the title matches the filename
- [ ] Related decisions: if links exist — the files exist

#### 3.2 Content quality

**Context:**
- Does it describe the *problem*, not just the situation?
- Is it clear *why* this decision was needed?
- Is there a hint that alternatives were considered?

**Decision:**
- Is it stated concretely? The reader must unambiguously understand what exactly was chosen.
- Is it not mixed up with Context or Consequences?

**Consequences:**
- Are both pros and cons/limitations listed?
- Are there concrete technical consequences (what needs to be done, what changes in the system)?
- No baseless optimism ("everything will be fine" with no details)?

#### 3.3 Compliance with ADR creation criteria

Per `docs/decisions/README.md` — an ADR is created if the decision is:
- *non-obvious* — real alternatives with trade-offs exist
- *hard to reverse* — switching approach would take significant effort
- *systemically significant* — affects the structure, data model, or behavior of multiple components

If none of the criteria hold — flag this explicitly.

#### 3.4 Consistency with accepted decisions

Check against all files in `docs/decisions/`:
- Does the new decision contradict already accepted decisions (status `Принято`)?
- If there's a contradiction — which decision should be revisited?
- Are there ADRs that should be listed in the `Связанные решения` field but aren't?

#### 3.5 Formatting

- [ ] Language — Russian
- [ ] Double spacing between blocks is followed
- [ ] Business entities are **bold**
- [ ] Field names are formatted as `<u>fieldName</u>`

---

### Step 4. Report

Print the result in this format:

```
## Ревью: NN-название-решения.md

### Форматирование
✓ / ✗ <что изменено>

### Качество контента
**Контекст:** <оценка + конкретные замечания>
**Решение:** <оценка + конкретные замечания>
**Последствия:** <оценка + конкретные замечания>

### Критерии ADR
<выполнены ли критерии — с аргументацией>

### Согласованность
<противоречия или подтверждение согласованности>

### Итог
Принято к приёмке / Требует доработки

**Блокирующие замечания:** (если есть)
- ...

**Рекомендации:** (некритичные улучшения)
- ...
```

If there are blocking issues — don't call the decision "accepted".
