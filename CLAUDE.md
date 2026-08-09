# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

**Kanbanify Todoist** — desktop-приложение (Electron), UI-клиент для Todoist, добавляющий kanban-статусы для **Задач** через встроенные **Лейблы** Todoist (не через нативные поля Todoist: на бесплатном тарифе API их не предоставляет).

Полное описание экранов и сценариев — [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md). Навигация по всей документации — [`docs/README.md`](docs/README.md), начинай оттуда, если нужен контекст за пределами этого файла. Конвенции кода — [`docs/COMMON_CODE_STYLE_GUIDE.md`](docs/COMMON_CODE_STYLE_GUIDE.md) и два процессных руководства рядом с ним. Обоснование выбора стека — [`docs/decisions/01-tech-stack.md`](docs/decisions/01-tech-stack.md), обоснование архитектурных конвенций — [`docs/decisions/02-architecture.md`](docs/decisions/02-architecture.md).

`docs/feat/*` — черновые короткоживущие мини-ТЗ пользователя, не в git (см. `.gitignore`) и не часть документации проекта. **Не читай файлы из этой папки** ни проактивно, ни через `docs/README.md` — если задача упомянута со ссылкой на файл в `docs/feat/`, работай по тексту, который пользователь дал в самом промпте.

### Структура репозитория и архитектура

Электрон-приложение (`electron-vite`) с тремя процессами, каждый — в своей директории под `src/`:

- **`src/main/`** — Electron main-процесс (бекенд). Здесь и только здесь доступен Todoist Access Token и `@doist/todoist-sdk`. Организован по **чистой архитектуре** (Clean Architecture): доменная логика (kanban-статусы, доменная модель задач) изолирована от Electron- и SDK-специфичных деталей через слои use cases / adapters / gateways.
- **`src/preload/`** — Electron preload-скрипт, единственный мост между main и renderer: описывает IPC-контракт, через который renderer запрашивает данные Todoist, не получая доступа к токену напрямую.
- **`src/renderer/src/`** — Electron renderer-процесс (фронтенд): React + React Router + Mantine UI + dnd-kit (drag-and-drop канбан-доски) + TanStack Query (серверное состояние, IPC-запросы, пагинация) + Day.js (работа со сроком задачи). Организован по **FSD** (Feature-Sliced Design) — слои и сегменты фич, публичные API слайсов.

Связь бекенда и фронтенда — исключительно через IPC (preload как контракт), renderer не имеет прямого доступа к Todoist API или токену.

### Ключевая доменная модель (из ТЗ)

Полные формулировки — в разделах «Ограничения тарифа» и «Доменная модель» [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md). Кратко:

- Kanban-статус **Задачи** (без статуса / todo / in-progress / completed) хранится не как отдельная сущность, а как **зарезервированный Лейбл** на **Задаче** — этим kanban-фреймворк отличается от нативного статуса `completed` в Todoist (**Задача** с **Лейблом** `completed` != выполненная задача в Todoist). Если зарезервированных **Лейблов** на **Задаче** несколько, актуальным считается самый правый по порядку колонок: `completed`, затем `in-progress`, затем `todo`.
- Приложение использует **только** функционал бесплатного тарифа. Поэтому поля `deadline` и `duration` (обе — функции Pro) не используются вовсе: роль дедлайна во всех экранах играет поле `due`. Не предлагай решений, опирающихся на платные функции.
- Приоритет обозначается по-интерфейсному (`p1` — наивысший, `p4` — обычный), а в API нумерация обратная (`priority = 4` — это `p1`) — частый источник ошибок.
- Задача просрочена, если её срок раньше текущего дня, а при заданном времени — раньше текущего момента (как фильтр `overdue`). Просроченные и сегодняшние списки не дублируют друг друга.
- Авторизация — через личный Todoist Access Token, без OAuth-флоу. Токен шифруется через Electron `safeStorage` и лежит в `app.getPath('userData')`; в открытом виде существует только в main-процессе, renderer ходит к API через IPC.
- Списки задач (Задачи, Сегодня, Календарь, Поиск) упираются во встроенную пагинацию Todoist (лимит 200 элементов) — везде, где показывается список задач, нужна догрузка/пагинация.
- У страницы «Задачи» два режима отображения — списочный и kanban (4 колонки по статусам); у «Календаря» — списочный и календарный (только масштаб «месяц»).

## Язык

Отвечай пользователю **на русском языке**, даже если скиллы, код или их документация (например, `.claude/skills/todoist-sdk/`) написаны на английском — английский там используется только для экономии токенов, а не как инструкция сменить язык общения.

## Команды разработки

Пакетный менеджер — **yarn** (через Corepack, версия зафиксирована в `packageManager`).

| Команда | Действие |
|---|---|
| `yarn dev` | запуск приложения в dev-режиме (`electron-vite dev --watch`) |
| `yarn build` | production-сборка (`electron-vite build`) |
| `yarn start` | предпросмотр production-сборки (`electron-vite preview`) |
| `yarn typecheck` | проверка типов отдельно для node- и web-частей (`tsconfig.node.json`, `tsconfig.web.json`) |
| `yarn test` | прогон тестов через Vitest (`vitest run`) |
| `yarn lint` | линт через `biome lint .` |
| `yarn format` | автоформатирование через `biome format --write .` |

## AI-инфраструктура (Claude Code)

Репозиторий использует Claude Code с обвязкой: скиллы, слэш-команды, агенты, хуки и MCP-серверы. Обоснование состава обвязки — [`docs/decisions/03-ai-harness.md`](docs/decisions/03-ai-harness.md). Вся обвязка хранится **строго в `.claude/`** в этом репозитории (MCP-серверы — исключение, их конфиг лежит в `.mcp.json` в корне репозитория, как того требует сам Claude Code) — не в домашней директории.

Разделение ответственности в обвязке: **руководства по коду** (`docs/*_CODE_STYLE_GUIDE.md`) — единственный источник конвенций, **скиллы** — процесс (порядок шагов, чек-листы, гейты) со ссылкой на руководство. Скилл не копирует правила из руководства: при расхождении прав руководство, а скилл считается устаревшим.

### Установленные скиллы

| Скилл | Источник | Назначение |
|---|---|---|
| [`git-commit`](.claude/skills/git-commit/SKILL.md) | самописный | Формирует conventional commit message по staged changes и коммитит после подтверждения |
| [`accept-adr`](.claude/skills/accept-adr/SKILL.md) | самописный | Форматирует ADR-файл под шаблон проекта и проводит строгое ревью содержания |
| [`todoist-sdk`](.claude/skills/todoist-sdk/SKILL.md) | самописный (спарсен из [GitHub-репозитория](https://github.com/Doist/todoist-sdk-typescript) `@doist/todoist-sdk`, версия `13.0.0`) | Справочник по TS SDK Todoist API: инициализация клиента, задачи/проекты/лейблы, пагинация, ошибки |
| [`feature-backend`](.claude/skills/feature-backend/SKILL.md) | самописный | Процесс реализации фичи/правки в `src/main` и `src/preload` по [`BACKEND_CODE_STYLE_GUIDE.md`](docs/BACKEND_CODE_STYLE_GUIDE.md) |
| [`feature-frontend`](.claude/skills/feature-frontend/SKILL.md) | самописный | Процесс реализации фичи/правки в `src/renderer` по [`FRONTEND_CODE_STYLE_GUIDE.md`](docs/FRONTEND_CODE_STYLE_GUIDE.md) |
| [`feature-fullstack`](.claude/skills/feature-fullstack/SKILL.md) | самописный | Оркестратор фичи через границу IPC: сначала контракт и бэкенд, затем фронтенд — в одном контексте, без субагентов |
| [`tanstack-query`](.claude/skills/tanstack-query/SKILL.md) | [skills.sh](https://skills.sh/), источник [`tanstack-skills/tanstack-skills`](https://github.com/tanstack-skills/tanstack-skills) | Справочник по TanStack Query v5: `useQuery`/`useInfiniteQuery`/`useMutation`, query keys, оптимистичные обновления, инвалидация кэша |

### Слэш-команды

| Команда | Действие |
|---|---|
| `/git-commit` | вызывает скилл `git-commit` |
| `/accept-adr <путь-к-adr>` | вызывает скилл `accept-adr` для указанного файла |
| `/feature-backend <описание>` | вызывает скилл `feature-backend` |
| `/feature-frontend <описание>` | вызывает скилл `feature-frontend` |
| `/feature <описание>` | вызывает скилл `feature-fullstack` |
| `/guide-review` | запускает агента `code-reviewer` по текущему дифу |

### Источник скиллов и lock-файл

Новые скиллы устанавливаются **только** через [skills.sh](https://skills.sh/) (`npx skills add <owner/repo@skill> -y`, без `-g` — скиллы этого проекта не глобальные) и автоматически фиксируются в [`skills-lock.json`](skills-lock.json) в корне репозитория (версия источника + хэш). Сами файлы скилла при этом всё равно кладутся под `.claude/skills/`.

Самописные скиллы (`git-commit`, `accept-adr`, `todoist-sdk`, `feature-*`) в `skills-lock.json` **не** фигурируют — это осознанно, лок-файл отражает только внешние источники.

Перед установкой нового скилла из реестра — проверяй качество источника (звёзды репозитория, число установок), как описано в скилле `find-skills`; не устанавливай скиллы с около-нулевым числом установок без явного согласия пользователя.

### MCP-серверы и агенты

| MCP-сервер | Источник | Назначение |
|---|---|---|
| `mantine` ([`.mcp.json`](.mcp.json), пакет [`@mantine/mcp-server`](https://www.npmjs.com/package/@mantine/mcp-server)) | официальный (мейнтейнер Mantine, `mantine.dev`) | Поиск и справка по документации компонентов Mantine UI при написании фронтенда |

| Агент | Назначение |
|---|---|
| [`code-reviewer`](.claude/agents/code-reviewer.md) | Read-only ревью дифа на соответствие обоим руководствам по коду и `SPECIFICATION.md`. Запускается субагентом осознанно: изолированный контекст даёт свежий взгляд, не защищающий собственный код |

Реализация фич субагентам **не** делегируется: фича через границу IPC требует непрерывного контекста (общий контракт между бэкендом и фронтендом), а субагент возвращает отчёт, а не состояние.

### Хуки

Настроены в [`.claude/settings.json`](.claude/settings.json):

| Хук | Действие |
|---|---|
| `PostToolUse` на `Edit`/`Write`/`MultiEdit` | прогоняет `yarn biome format --write` по изменённому файлу (`.ts`, `.tsx`, `.json`, `.md`) |
| `Stop` | запускает [`.claude/hooks/sdlc-gates.sh`](.claude/hooks/sdlc-gates.sh): `yarn typecheck` и `yarn test`, если в `src/` есть изменения. При красном результате блокирует завершение и возвращает вывод агенту на починку |

Гейт-скрипт пропускает прогон, когда `src/` не менялся (правки только в документации), и не блокирует повторно при уже активном stop-хуке — чтобы непочиняемая ошибка не зациклила сессию.

### Правило актуализации

При добавлении, изменении или удалении скилла, команды, MCP-сервера, агента или хука — **в том же коммите** обнови:

1. Таблицы в этом разделе `CLAUDE.md` (описание, ссылку на файл)
2. `skills-lock.json`, если менялся набор скиллов из skills.sh
3. Любые перекрёстные ссылки в `docs/README.md`, если они затронуты
4. [`docs/decisions/03-ai-harness.md`](docs/decisions/03-ai-harness.md) — если изменение отменяет принятое там решение, а не просто дополняет состав обвязки: ADR либо помечается `Устарело`, либо заменяется новым (правила — в [`docs/decisions/README.md`](docs/decisions/README.md))

Устаревшее описание AI-обвязки хуже отсутствующего — оно вводит в заблуждение будущий запуск Claude Code.

## Работа с решениями (ADR)

Значимые архитектурные и технические решения фиксируются в `docs/decisions/` по паттерну ADR. Когда создаёшь такое решение — заводи файл `docs/decisions/NN-название.md` и приводи его к шаблону и ревью через скилл `accept-adr` (см. [`docs/decisions/README.md`](docs/decisions/README.md) за критериями «когда нужен ADR» и [`docs/decisions/00-use-adr.md`](docs/decisions/00-use-adr.md) за обоснованием самого паттерна).

## Правила форматирования документации

Документация в `docs/` и `README.md` пишется на русском языке; полный набор правил (выделение бизнес-сущностей, полей, отступы) — в разделе «Правила форматирования» [`docs/README.md`](docs/README.md). Правила для кода — противоположные (весь код на английском), см. [`docs/COMMON_CODE_STYLE_GUIDE.md`](docs/COMMON_CODE_STYLE_GUIDE.md).
