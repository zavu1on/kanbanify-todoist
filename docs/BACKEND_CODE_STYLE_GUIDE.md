# Backend. Руководство по разработке и оформлению кода

Технологический стек и обоснование выбора — [`decisions/01-tech-stack.md`](decisions/01-tech-stack.md). Здесь — конкретные конвенции кода для `src/main/` и `src/preload/`.

Прежде чем писать бэкенд-код, держи в голове доменные ограничения из [`SPECIFICATION.md`](SPECIFICATION.md) — они источник самых дорогих ошибок:

- Приоритет в API инвертирован относительно интерфейса: `p1` (наивысший) — это `priority = 4`, `p4` (обычный) — `priority = 1`
- Kanban-статус — это зарезервированный Todoist-**Лейбл** на **Задаче**, а не отдельная сущность и не нативный `completed` из Todoist. Если зарезервированных лейблов несколько, актуален самый правый по порядку колонок: `completed` → `in-progress` → `todo`
- Используется **только** бесплатный тариф: поля <u>deadline</u> и <u>duration</u> не трогаются вовсе, роль дедлайна играет <u>due</u>
- Любой список **Задач** упирается во встроенную пагинацию Todoist (лимит 200) — эндпоинт, отдающий список, обязан поддерживать догрузку


## Архитектура

Архитектура проекта — `clean architecture`, реализуй в ООП-стиле (классы, а не наборы функций). В корне `src/main` располагаются модули (например, `auth`), внутри каждого — слои чистой архитектуры:

| Слой | Содержит |
|---|---|
| `domain/` | Сущности (`entities/`), value objects (`value-objects/`), доменные ошибки (`errors/`), IPC-контракты (`contracts/`) |
| `application/` | Интерфейсы портов (`ports/`), DTO (`dtos/`), use-case'ы (`use-cases/`) |
| `infrastructure/` | Реализация портов (SDK-клиенты, файловое хранилище, IPC-контроллеры) |

Правило зависимостей — только внутрь: `infrastructure` знает про `application` и `domain`, `application` знает про `domain`, `domain` не знает ни про что снаружи. `infrastructure` реализует интерфейсы портов из `application/ports`, а не наоборот.

Сборка зависимостей (DI) — вручную, без DI-фреймворка. Единственное место, где создаются конкретные реализации и передаются друг другу как зависимости, — `src/main/index.ts`:

```ts
const loginUseCase = new LoginUseCase(
  new TodoistUserGateway(),
  new SafeStorageTokenStore(),
);
new AuthIpcController(loginUseCase).register();
```

Наружу модуль отдаёт **публичный API** — barrel-файл `<module>/index.ts`, реэкспортирующий только то, что нужно `preload`/renderer (IPC-контракты, Zod-схемы, но не use-case'ы и не реализации портов):

```ts
// auth/index.ts
export type { AuthErrorType, LoginResult } from "./domain/contracts/LoginResult";
export { accessTokenSchema } from "./domain/value-objects/AccessToken";
```

В `src/preload` — только описание IPC-моста через `contextBridge`/`ipcRenderer.invoke`, никакой бизнес-логики.


## Naming и структура кода

- Один класс/интерфейс/тип — один файл, имя файла = имя экспорта (`PascalCase.ts`)
- Интерфейсы портов — префикс `I` (`ITokenStore`, `ITodoistUserGateway`), лежат в `application/ports/`
- Доменные ошибки — на модуль один абстрактный базовый класс (`AuthError extends Error`, с `this.name = new.target.name`), от него наследуются конкретные ошибки (`InvalidAccessTokenError`, `TodoistAuthConnectionError`). Инфраструктурный код бросает конкретные ошибки, `infrastructure`-контроллер на границе IPC ловит базовый класс модуля и мапит в тип по `instanceof`
- Value objects — приватный конструктор + статическая фабрика `safeParse`, возвращающая discriminated union (`{ success: true; data } | { success: false; error }`), а не бросающая исключение:
  ```ts
  export class AccessToken {
    private constructor(readonly value: string) {}
    static safeParse(raw: string): AccessTokenParseSuccess | AccessTokenParseFailure { ... }
  }
  ```
- Сущности — классы с `readonly`-полями, задаваемыми через конструктор, без сеттеров
- Use-case — класс, реализующий `UseCase<TInput, TOutput>` (`src/main/shared/UseCase.ts`), с методом `execute`; зависимости — через конструктор (`private readonly`)
- DTO — простые `interface` или `class` с конструктором вида `constructor(readonly value: string) {}`  в `application/dtos/`, без методов


## Язык кода

Весь код — на английском: имена, комментарии, JSDoc, сообщения ошибок (`throw new InvalidAccessTokenError("Access token is not valid")`), тексты в тестах. Русский язык — только в документации (`docs/`, `README.md`, `CLAUDE.md`).

Сообщение ошибки из `domain/errors/` может дойти до пользователя через поле `message` в IPC-контракте — это техническая диагностика, а не UI-текст: renderer сам решает, показать её или подменить своей формулировкой.


## IPC-контракт и обработка ошибок

- Каждый модуль, которому нужен IPC, заводит `infrastructure/<Module>IpcController.ts`, реализующий `IpcController` (`src/main/shared/IpcController.ts`) с методом `register()`, вызывающим `ipcMain.handle(...)`
- Имя канала — `module:action` (`auth:login`)
- **Ошибки никогда не пересекают границу IPC как исключение.** Контроллер оборачивает вызов use-case'а в `try/catch` и всегда возвращает сериализуемый discriminated union, определённый в `domain/contracts/` модуля:
  ```ts
  type LoginResult =
    | { ok: true; user: AuthenticatedUser; tokenStorageWarning?: string }
    | { ok: false; error: { type: AuthErrorType; message: string } };
  ```
  Этот тип — общий контракт для `preload` и renderer (импортируется оттуда через `@/main`), поэтому он живёт в `domain/contracts/`, а не дублируется на фронте
- Zod-схемы полей, общие с фронтендом (например, `accessTokenSchema`), — тоже в `domain/value-objects/` соответствующего модуля и реэкспортируются через barrel; фронтенд не заводит свою копию


## Рецепт: как добавить функциональность

Порядок шагов — снизу вверх, от домена к границе процесса. Так тип, который в конце импортирует фронтенд, рождается один раз и в правильном слое.

### Новый модуль (например, `tasks`)

1. `domain/entities/` — сущность (`Task`), `readonly`-поля через конструктор
2. `domain/value-objects/` — value objects со `safeParse` и Zod-схемы, если поле валидируется и на фронте
3. `domain/errors/` — базовый абстрактный `TasksError extends Error` + конкретные наследники под каждый различимый снаружи случай отказа
4. `domain/contracts/` — сериализуемый discriminated union результата (`{ ok: true; ... } | { ok: false; error: { type; message } }`) и union типов ошибок
5. `application/ports/` — интерфейс порта (`ITaskGateway`) с комментарием о том, какие ошибки он может бросить
6. `application/dtos/` — DTO входа/выхода use-case'а, если он не совпадает с сущностью
7. `application/use-cases/` — use-case, реализующий `UseCase<TInput, TOutput>`, зависимости через конструктор
8. `infrastructure/` — реализация порта (SDK-клиент, хранилище) и `<Module>IpcController` с `register()`
9. `<module>/index.ts` — barrel: **только** контракты и общие с фронтендом Zod-схемы
10. `src/main/index.ts` — сборка зависимостей вручную в `registerIpcHandlers` и вызов `register()` у контроллера
11. `src/preload/index.ts` — новый метод в объекте `api` под ключом модуля, возвращающий `ipcRenderer.invoke("module:action", ...)`, тип результата импортируется из `../main/<module>`

Типизация `window.api` (`src/preload/global.d.ts`) выводится из объекта `api` автоматически — руками её править не нужно.

### Новый канал в существующем модуле

Шаги 4–8, 10 (только `register()` уже вызывается — добавляется лишь новая зависимость, если она появилась) и 11. Новый use-case — новый файл, не новый метод в существующем use-case'е.

### После изменений

Пройди SDLC (раздел ниже). Если появился новый модуль — проверь, не нужно ли обновить `docs/README.md` или завести ADR.


## Чего делать нельзя

- Импортировать `@doist/todoist-sdk`, читать токен или трогать `safeStorage` где-либо, кроме `src/main/*/infrastructure/`
- Пропускать исключение через границу IPC — контроллер всегда возвращает discriminated union
- Импортировать `electron` в `domain/` или `application/` — эти слои не знают о рантайме
- Заставлять `application` зависеть от `infrastructure`: use-case принимает интерфейс порта, а не конкретный класс
- Собирать зависимости где-либо, кроме `src/main/index.ts`
- Реэкспортировать из barrel'а use-case'ы, сущности с методами, реализации портов — наружу уходят только контракты и схемы
- Писать бизнес-логику в `src/preload` — там только проброс `ipcRenderer.invoke`
- Опираться на <u>deadline</u>, <u>duration</u> и прочие Pro-функции Todoist


## Комментарии

Комментарии объясняют **почему**, а не что делает код — например, почему `SafeStorageTokenStore` откатывается на plaintext-хранение, а не почему он «сохраняет токен». Если убрать комментарий и смысл кода не потеряется — комментарий лишний. Также комментарий показывает, какие ошибки может выкидывать метод (актуально для портов).


## Тестирование

Тестов для `src/main`/`src/preload` пока нет — конвенция ниже фиксируется на будущее, по аналогии с фронтендом ([`FRONTEND_CODE_STYLE_GUIDE.md`](FRONTEND_CODE_STYLE_GUIDE.md), раздел «Тестирование»):

- Тест — `*.spec.ts`, рядом с тестируемым файлом
- Тестовый раннер — Vitest; конфиг ([`vitest.config.ts`](../vitest.config.ts)) на весь проект один, `environment: "jsdom"` — при тестировании `src/main` это не мешает (Node API доступны), но модули `electron` (`ipcMain`, `app`, `safeStorage` и т.д.) нужно мокать через `vi.mock("electron", ...)`, а не полагаться на реальный рантайм — в тестовом окружении Electron не запущен
- Порты (`ITokenStore`, `ITodoistUserGateway`) в тестах use-case'ов мокаются напрямую (это и есть их назначение) — не тестируй use-case через реальную инфраструктуру


## Форматирование и импорты

Форматирование и линт — Biome (`yarn format`, `yarn lint`), общий конфиг для всего проекта — [`biome.json`](../biome.json): двойные кавычки, точки с запятой всегда, скобки у всех стрелочных функций, сортировка импортов автоматическая (`organizeImports`).


## SDLC

1. разработка новой фичи / внесение правок
2. добавление / актуализация unit-тестов
3. проверь, нет ли висящих ссылок / нужно ли обновить документацию / завести новый ADR (последнее согласуй со мной)
4. `yarn typecheck` & `yarn format`
5. `yarn test`
6. ожидание ревью от человека
7. `/git-commit`

Шаги 4 и 5 частично автоматизированы хуками Claude Code (`.claude/settings.json`): `yarn format` прогоняется по каждому изменённому файлу после правки, а `yarn typecheck` и `yarn test` — перед завершением работы агента, если менялось что-то в `src/`; при красном результате агент не заканчивает работу, а чинит. Хуки — страховка, а не замена шагам: запускай проверки и сам, не дожидаясь конца сессии.


## Claude Code

- Реализация фичи или правки на бэкенде — скилл `feature-backend`; фича, затрагивающая и бэкенд, и фронтенд, — скилл `feature-fullstack`
- Любой код, вызывающий Todoist API, пишется по скиллу `todoist-sdk` (сигнатуры методов, пагинация, формы ошибок), а не по памяти — SDK меняет API между мажорными версиями
- Ревью готового дифа на соответствие этому руководству — агент `code-reviewer`
- Оформление коммита — скилл `git-commit`
