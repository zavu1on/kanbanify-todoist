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

Порт может использоваться use-case'ами другого модуля — так, `ITokenStore`/`SafeStorageTokenStore` живут в `auth` (токен по смыслу принадлежит авторизации), а `tasks`-модуль импортирует порт оттуда напрямую (`auth/application/ports/ITokenStore`), не заводя свою копию. Модуль, которому конкретный порт принадлежит, определяется семантикой (что это за данные и кто ответственен за их жизненный цикл), а не тем, кто первым в нём нуждался.

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
- **Мапперы — классы, и живут в `domain/mappers/`.** Маппинг сырого ответа API в доменную сущность (`TaskMapper.toDomain`) и маппинг классифицированной ошибки в конкретный класс доменной ошибки (`TasksErrorMapper.toDomainError`) — это доменная логика («какая сущность/ошибка собирается из этих данных»), поэтому не метод гейтвея и не файл в `infrastructure/`:
  ```ts
  // domain/mappers/TaskMapper.ts
  export class TaskMapper {
    toDomain(source: TaskApiSource): Task { ... }
  }

  // domain/errors/TasksErrorMapper.ts
  export class TasksErrorMapper {
    toDomainError(kind: TasksErrorKind, message?: string): TasksError { ... }
  }
  ```
  `TaskApiSource` — структурный тип с нужными полями, а не тип SDK: маппер в `domain/` не имеет права импортировать `@doist/todoist-sdk` (см. «Чего делать нельзя»). По этой же причине классификация SDK-ошибки (`error instanceof TodoistRequestError`) не может жить в доменном мапере — она остаётся в `infrastructure/<Module>ErrorClassifier.ts`, который читает `TodoistRequestError`, определяет `kind` (`"auth" | "network" | "unknown"`) и передаёт его доменному `<Module>ErrorMapper`, а не строит ошибку сам:
  ```ts
  // infrastructure/TodoistTasksErrorClassifier.ts
  export class TodoistTasksErrorClassifier {
    private readonly errorMapper = new TasksErrorMapper();
    async wrap<T>(fn: () => Promise<T>): Promise<T> {
      try { return await fn(); }
      catch (error) {
        if (error instanceof TodoistRequestError) {
          throw this.errorMapper.toDomainError(error.isAuthenticationError() ? "auth" : "network");
        }
        throw this.errorMapper.toDomainError("unknown", error instanceof Error ? error.message : undefined);
      }
    }
  }
  ```
  Гейтвей держит оба как приватные поля (`private readonly taskMapper = new TaskMapper()`) и вызывает их методы, не содержит их тел
- **Все доменные сущности, value objects и мапперы — классы**, не `interface`/plain-object/объект с методами. Доменная логика, которая определяет их поведение (валидация, разрешение конфликтов, применение изменений, маппинг), живёт как метод класса:
  ```ts
  export class KanbanStatus {
    private constructor(readonly level: KanbanStatusLevel, readonly hasConflict: boolean) {}
    static resolve(labels: string[]): KanbanStatus { ... }
    applyTo(labels: string[]): string[] { ... }
  }
  ```
  Если у класса в итоге остались бы только статические методы, biome (`noStaticOnlyClass`) не даст оформить это классом — так и должно быть: значит, у него по ошибке нет состояния/инстанс-метода. Для мапперов решение — метод `toDomain`/`toDomainError` делай **инстанс-методом**, а не `static` (даже если он не читает поля), и создавай маппер через `new` там, где он используется (`private readonly taskMapper = new TaskMapper()` в гейтвее). Это не «настоящее» состояние, но проходит правило и держит мапперы в общем ряду с сущностями/VO как классы, а не как исключение из него
- Value objects — приватный конструктор + статическая фабрика `safeParse` (для валидируемого ввода, возвращает discriminated union `{ success: true; data } | { success: false; error }`, а не бросает исключение) либо `of`/`fromApiValue` (для доверенного ввода, без валидации):
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
  type LoginResult = ({ ok: true } & LoginOutput) | AuthFailure;
  ```
  Этот тип — общий контракт для `preload` и renderer (импортируется оттуда через `@/main`), поэтому он живёт в `domain/contracts/`, а не дублируется на фронте
- **Неудачный результат вида `{ ok: false; error: { type: XxxErrorType; message: string } }` не дублируется по контрактам.** На модуль — один тип-неудача в `domain/contracts/<Module>Failure.ts` (например, `AuthFailure`, `TasksFailure`), рядом с ним — union типов ошибок модуля (`AuthErrorType`/`TasksErrorType`). Каждый контракт модуля ссылается на этот тип, а не переопределяет форму заново:
  ```ts
  // domain/contracts/AuthFailure.ts
  export type AuthErrorType = "invalid_token" | "network_error" | "unknown";
  export type AuthFailure = { ok: false; error: { type: AuthErrorType; message: string } };

  // domain/contracts/LoginResult.ts
  export type LoginResult = ({ ok: true } & LoginOutput) | AuthFailure;
  ```
  Если у контракта неудачи другой дискриминант, а не `ok: false` (например, `SessionCheckResult` использует `status: "error"`), переиспользуй хотя бы форму `error: { type; message }` через `AuthFailure["error"]`, а не переопределяй её
- **Возвращаемые типы, пересекающиеся между портом, его инфраструктурной реализацией и доменным контрактом, живут в одном месте — в порте** (`application/ports/`), а не дублируются в каждом слое. Порт экспортирует именованный тип для формы, которую отдаёт его метод; use-case и `domain/contracts/` ссылаются на этот тип, а не переопределяют поля заново:
  ```ts
  // application/ports/ITaskGateway.ts
  export interface TaskListPage { tasks: Task[]; nextCursor: string | null; }
  export interface ITaskGateway {
    listTasks(accessToken: string, cursor: string | null): Promise<TaskListPage>;
  }

  // application/use-cases/ListTasksUseCase.ts
  export class ListTasksUseCase implements UseCase<string | null, TaskListPage> { ... }

  // domain/contracts/TasksListResult.ts
  import type { TaskListPage } from "../../application/ports/ITaskGateway";
  export type TasksListResult = ({ ok: true } & TaskListPage) | TasksFailure;
  ```
  Импорт из `domain/contracts/` в `application/ports/` — только `import type`: он стирается при компиляции, так что `domain` не приобретает рантайм-зависимость от `application`, только разделяет форму типа. Это единственное исключение из правила зависимостей выше, и оно допустимо только для этого типа импорта
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

Обязательному покрытию unit-тестами подлежат:

- **Доменная логика** — сущности и Value Object'ы (`domain/entities/`, `domain/value-objects/`), в первую очередь там, где есть нетривиальные правила (например, разрешение конфликта Kanban-статусов в `KanbanStatus.resolve`, инверсия приоритета в `Priority.fromApiValue`)
- **Use case'ы** (`application/use-cases/`) — включая обработку отсутствующей/невалидной сессии (`ITokenStore.load() === null`) и делегирование в gateway с правильными аргументами

Инфраструктура (`infrastructure/`, адаптеры к `@doist/todoist-sdk`) unit-тестами не покрывается — она проверяется вручную/интеграционно, юнит-тестов на прямой вызов SDK нет смысла писать.

Конвенции:

- Тест — `*.spec.ts`, рядом с тестируемым файлом
- Тестовый раннер — Vitest; конфиг ([`vitest.config.ts`](../vitest.config.ts)) на весь проект один, `environment: "jsdom"` — при тестировании `src/main` это не мешает (Node API доступны), но модули `electron` (`ipcMain`, `app`, `safeStorage` и т.д.) нужно мокать через `vi.mock("electron", ...)`, а не полагаться на реальный рантайм — в тестовом окружении Electron не запущен
- Порты (`ITokenStore`, `ITaskGateway`, `ITodoistUserGateway`) в тестах use-case'ов мокаются напрямую (это и есть их назначение) — не тестируй use-case через реальную инфраструктуру


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
