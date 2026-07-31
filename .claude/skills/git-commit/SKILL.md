---
name: git-commit
description: Generates a conventional commit message from staged changes — past-tense English verbs, bulleted body — then commits after confirmation.
---

# Git Commit

Скилл анализирует **только staged changes**, формирует conventional commit message по правилам проекта и выполняет коммит после подтверждения.

## Формат коммита

```
type(scope): past-tense-verb short summary

- past-tense-verb specific detail
- past-tense-verb specific detail
```

**Обязательные правила:**
- Язык — строго **английский**. Лексика уровня B2
- Глаголы — **прошедшее время**: `created`, `added`, `fixed`, `removed`, `updated`, `refactored`, `moved`, `renamed`, `deleted`, `implemented`, `extracted`, `configured`, `changed`, `replaced`, `improved`
- `type` — один из: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- `scope` — опционально, только если добавляет смысл (например, `auth`, `api`, `adr`); без scope — `type: verb summary`
- Заголовок — краткий, до 72 символов
- Тело — маркированный список (`-`), каждый пункт начинается с глагола в прошедшем времени
- Тело **обязательно**, если затронуто более одного файла или изменение нетривиальное
- Тело **не нужно**, если изменение в одном файле и заголовок полностью его описывает
- Тело **лаконичное**: максимум 4 пункта, один пункт — одно смысловое действие, не файл
  - Объединяй однотипные изменения в один пункт (например, несколько новых ADR-файлов → один пункт `added ADR files for X, Y, Z`, а не по пункту на файл)
  - Не перечисляй файлы построчно — описывай суть изменения, а не список путей
  - Не повторяй в теле то, что уже сказано в заголовке
  - Если после группировки остаётся один пункт, дублирующий заголовок по смыслу — убери тело вообще

**Примеры:**

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

## Пайплайн

Выполняй шаги строго по порядку.

---

### Шаг 1. Проверь staged changes

Запусти обе команды:

```bash
git status --short
git diff --staged
```

Если staged changes **нет** (вывод `git diff --staged` пустой) — сообщи:
> Нет staged changes. Добавь файлы командой `git add <file>` и вызови скилл снова.

Остановись. Не анализируй unstaged изменения.

---

### Шаг 2. Сформируй commit message

На основе `git diff --staged`:

1. Определи **тип** (`type`): что за изменение — новая функция, фикс, документация, рефакторинг?
2. Определи **scope** (если релевантен): какая область системы затронута?
3. Напиши **заголовок**: `type(scope): verb summary` или `type: verb summary` — кратко, до 72 символов
4. Составь **тело**: сгруппируй изменения по смыслу и опиши каждую группу одним пунктом (не более 4 пунктов, без перечисления файлов)

Правило выбора типа:
- `feat` — новая функциональность для пользователя/системы
- `fix` — исправление ошибки
- `docs` — изменения только в документации
- `refactor` — рефакторинг без изменения функциональности
- `chore` — обслуживание: зависимости, конфиги, скрипты
- `test` — добавление или изменение тестов
- `style` — форматирование, пробелы (не влияет на логику)
- `ci` — изменения в CI/CD пайплайне
- `build` — изменения системы сборки

---

### Шаг 3. Покажи сообщение и запроси подтверждение

Выведи предлагаемый коммит в блоке кода и задай вопрос:

```
Предлагаемый коммит:

───────────────────────────────────
docs: created initial docs/ structure
- created ENTITIES.md
- created mock decision files for ADR pattern
───────────────────────────────────

Выполнить коммит? [да / нет / edit]
```

Варианты ответа пользователя:
- **да** / **y** / **yes** — перейди к Шагу 4
- **нет** / **n** / **no** — остановись, не коммить, скажи что операция отменена
- **edit** / **исправь** / любое пояснение — прими правки, скорректируй сообщение и покажи снова

---

### Шаг 4. Выполни коммит

Выполни `git commit` с многострочным сообщением через HEREDOC:

```bash
git commit -m "$(cat <<'COMMIT_MSG'
type(scope): verb summary

- verb detail 1
- verb detail 2
COMMIT_MSG
)"
```

После выполнения:
- Если коммит прошёл успешно — выведи хэш и первую строку сообщения
- Если коммит не прошёл (pre-commit hook, ошибка) — выведи текст ошибки и **не** пытайся коммитить повторно; скажи пользователю что нужно исправить
