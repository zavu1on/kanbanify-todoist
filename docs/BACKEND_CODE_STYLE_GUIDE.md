# Backend. Руководство по разработке и оформлению кода

Технологический стек и обоснование выбора — [`decisions/01-tech-stack.md`](decisions/01-tech-stack.md). Общие для обоих процессов конвенции (язык кода, форматирование, SDLC) — [`COMMON_CODE_STYLE_GUIDE.md`](COMMON_CODE_STYLE_GUIDE.md). Здесь — конкретные конвенции кода для `src/main/` и `src/preload/`.

Прежде чем писать бэкенд-код, перечитай доменные ограничения — разделы «Ограничения тарифа» и «Доменная модель» [`SPECIFICATION.md`](SPECIFICATION.md). Инверсия приоритета, kanban-статус как зарезервированный **Лейбл**, запрет на Pro-поля и лимит пагинации в 200 элементов — источник самых дорогих ошибок на бэкенде, и именно они определяют форму доменных сущностей.


## Архитектура

Архитектура проекта — `clean architecture`, реализуй в ООП-стиле (классы, а не наборы функций). В корне `src/main` располагаются модули (например, `auth`), внутри каждого — слои чистой архитектуры:

| Слой | Содержит |
|---|---|
| `domain/` | Сущности (`entities/`), value objects (`value-objects/`), доменные ошибки (`errors/`), мапперы (`mappers/`), DTO сущностей для IPC (`dtos/`), IPC-контракты (`contracts/`) |
| `application/` | Интерфейсы портов (`ports/`), DTO входа/выхода use-case'ов (`dtos/`), use-case'ы (`use-cases/`) |
| `infrastructure/` | Реализация портов (SDK-клиенты, файловое хранилище, IPC-контроллеры) |

Два разных `dtos/` не дублируют друг друга: `application/dtos/` — вход/выход use-case'а внутри main-процесса (`CreateProjectInput`), никогда не пересекает IPC как есть. `domain/dtos/` — исходящая наружу проекция доменной сущности (`ProjectDTO`), формируется мапером и живёт в `domain/`, потому что «какие поля сущности видны снаружи» — это домену принадлежащее решение, а не деталь конкретного use-case'а.

Правило зависимостей — только внутрь: `infrastructure` знает про `application` и `domain`, `application` знает про `domain`, `domain` не знает ни про что снаружи. `infrastructure` реализует интерфейсы портов из `application/ports`, а не наоборот.

Порт может использоваться use-case'ами другого модуля — так, `ITokenStore`/`SafeStorageTokenStore` живут в `auth` (токен по смыслу принадлежит авторизации), а `tasks`-модуль импортирует порт оттуда напрямую (`auth/application/ports/ITokenStore`), не заводя свою копию. Модуль, которому конкретный порт принадлежит, определяется семантикой (что это за данные и кто ответственен за их жизненный цикл), а не тем, кто первым в нём нуждался.

**Бизнес-логика живёт исключительно в доменных сущностях** (`domain/entities/`) — не в use-case'е, не в гейтвее и не в value object'е (разбор границы «сущность против VO» — в разделе «Naming и структура кода» ниже). Use-case — это оркестрация: он через порт находит/мэпит сущность, вызывает её метод, а затем сохраняет результат через порт. Сама логика (валидация, разрешение конфликтов, инварианты вроде «нельзя архивировать Inbox-проект») описывается только методом сущности и покрывается unit-тестом на эту сущность — не на use-case, который лишь проверяет факт делегирования:

```ts
// domain/entities/Project.ts
archive(): void {
  if (this.isInboxProject) throw new InboxProjectProtectedError("archive");
}

// application/use-cases/ArchiveProjectUseCase.ts
async execute(projectId: string): Promise<void> {
  const project = this.projectMapper.toDomain(await this.projectGateway.getProject(token, projectId), 0);
  project.archive(); // бизнес-правило и его исключение — только здесь
  await this.projectGateway.archive(token, projectId);
}
```

После применения изменений сущность сохраняется через порт методом `upsert`/`save`. Специфичные методы порта (`delete`, `archive`) допустимы, когда суть действия выходит за рамки классического обновления состояния (удаление/архивация — не PATCH, а отдельный API-вызов) — в этом случае метод сущности (`archive()`/`delete()`) всё равно вызывается первым, чтобы провалидировать инвариант, а специфичный метод порта делает вызов.

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
- **Все доменные сущности, value objects и мапперы — классы**, не `interface`/plain-object/объект с методами. Поведение каждого из них живёт как метод класса, а не как отдельная функция-хелпер рядом. Если у класса остались бы только статические методы, biome (`noStaticOnlyClass`) не даст оформить это классом — для мапперов решение в том, чтобы делать `toDomain`/`toDomainError` **инстанс-методом**, а не `static`, и создавать маппер через `new` там, где он используется (`private readonly taskMapper = new TaskMapper()` в гейтвее)
- **Value objects** — приватный конструктор; поля — либо `readonly`, либо `private` с публичным геттером. Фабричный метод — одна штука, название свободное и подобранное по смыслу: `safeParse` для валидируемого ввода (возвращает discriminated union `{ success: true; data } | { success: false; error }`, а не бросает исключение), `of`/`fromApiValue`/`fromSafe` для уже доверенного ввода (без валидации, не перепроверяет то, что уже провалидировано раньше):
  ```ts
  export class AccessToken {
    private constructor(readonly value: string) {}
    static of(value: string): AccessToken {
      return new AccessToken(value);
    }
    static safeParse(raw: string): AccessTokenParseSuccess | AccessTokenParseFailure { ... }
  }
  ```
  **VO не содержит бизнес-логики** — он только представляет значение: как оно выглядит, как проверяется его формат, как оно кодируется и декодируется в форму, принятую во внешнем API. Всё, что требует знания *другой* сущности, состояния агрегата или разрешения конфликта между значениями, — это правило домена, и оно принадлежит сущности.

  Эталон границы — **Задача** и её kanban-статус (`tasks/domain/`). `KanbanStatus` знает ровно две вещи про значение: какие имена **Лейблов** зарезервированы (`stripReserved`) и как наложить статус на список лейблов **Задачи** (`applyTo`) — это кодирование значения, не правило. А правило «если зарезервированных лейблов несколько, побеждает самый правый по порядку колонок» знает только `Task.resolveStatus`, потому что оно рассуждает о состоянии **Задачи** целиком, а не об одном статусе:
  ```ts
  // domain/value-objects/KanbanStatus.ts — представление значения
  export class KanbanStatus {
    private constructor(readonly level: KanbanStatusLevel, readonly hasConflict: boolean) {}
    static of(level: KanbanStatusLevel, hasConflict = false): KanbanStatus { ... }
    static stripReserved(labels: string[]): string[] { ... }
    applyTo(labels: string[]): string[] { ... }
  }

  // domain/entities/Task.ts — правило домена
  private static resolveStatus(rawLabels: string[]): KanbanStatus {
    const present = RESERVED_LABELS.filter((reserved) => rawLabels.includes(reserved));
    if (present.length === 0) return KanbanStatus.of("none");
    return KanbanStatus.of(present[present.length - 1], present.length > 1);
  }
  ```
  Инверсия приоритета (`Priority.fromApiValue`) по этой же границе остаётся в VO: это перевод одного и того же значения между нумерацией API и нумерацией интерфейса, а не решение о том, что домену делать
- **Сущности** — приватный конструктор; поля — либо `readonly`, либо `private` с публичным геттером (поле, которое меняет метод сущности, — `private`, наружу отдаётся только через геттер, не сеттер). Вся бизнес-логика, которая меняет состояние сущности (валидация, разрешение конфликтов, применение изменений — см. «Архитектура» выше), — методами сущности. У сущности два статических фабричных метода, а не один конструктор на все случаи:
  - `create` — для ещё не существующей сущности; валидирует инварианты и бросает доменную ошибку при нарушении
  - `reconstitute` — для восстановления сущности из уже провалидированных данных (ответ API, персистентное хранилище — то, что даёт маппер/порт); инварианты повторно **не** проверяет, доверяет источнику

  **Аргумент фабричного/мутирующего метода из более чем двух полей — именованный тип, объявленный тут же, в файле сущности** (`export type <Method><Entity>...`), не инлайновый object-literal-тип в сигнатуре. Инлайновый тип на 3+ поля нечитаем в сигнатуре и не переиспользуется тестом, который строит те же данные:
  ```ts
  export type ProjectCreateDetails = { name: string; description: string };
  export type ProjectReconstituteSource = {
    id: string;
    name: string;
    isInboxProject: boolean;
  };

  export class Project {
    private constructor(
      private _id: string,
      private _name: string,
      private readonly _isInboxProject: boolean,
    ) {}

    get id(): string {
      return this._id;
    }
    get name(): string {
      return this._name;
    }

    static create(details: ProjectCreateDetails): Project {
      return new Project("", Project.parseName(details.name), false);
    }

    static reconstitute(source: ProjectReconstituteSource): Project {
      return new Project(source.id, source.name, source.isInboxProject);
    }

    rename(name: string): void {
      this._name = Project.parseName(name); // мутация — через приватное поле, наружу только геттер
    }

    private static parseName(rawName: string): string { ... } // делегирует VO (см. пример `AccessToken` выше)
  }
  ```
  Ровно два поля можно оставить инлайновым типом — граница именно «больше двух», не «больше одного»: пара полей ещё читается на одной строке сигнатуры, третье поле уже нет.

  Доменная логика сущностей и VO обязательно покрывается unit-тестами (см. «Тестирование»)
- Use-case — класс, реализующий `UseCase<TInput, TOutput>` (`src/main/shared/UseCase.ts`), с методом `execute`; зависимости — через конструктор (`private readonly`)
- DTO — простые `interface` или `class` с конструктором вида `constructor(readonly value: string) {}`  в `application/dtos/`, без методов


## Язык кода

Общее правило — в [`COMMON_CODE_STYLE_GUIDE.md`](COMMON_CODE_STYLE_GUIDE.md). На бэкенде оно распространяется и на сообщения доменных ошибок: `throw new InvalidAccessTokenError("Access token is not valid")`.

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
- **Возвращаемые типы, пересекающиеся между портом и его инфраструктурной реализацией, живут в одном месте — в порте** (`application/ports/`), а не дублируются в каждом слое; use-case ссылается на этот тип, а не переопределяет поля заново. Если этот тип несёт доменную сущность (не только примитивы), `domain/contracts/` на него напрямую не ссылается — сущность внутри него всё равно обязана дойти до контракта только через DTO (см. правило чуть ниже):
  ```ts
  // application/ports/ITaskGateway.ts
  export interface TaskListPage { tasks: Task[]; nextCursor: string | null; }
  export interface ITaskGateway {
    listTasks(accessToken: string, cursor: string | null): Promise<TaskListPage>;
  }

  // application/use-cases/ListTasksUseCase.ts
  export class ListTasksUseCase implements UseCase<string | null, TaskListPage> { ... }

  // domain/contracts/TasksListResult.ts — `TaskListPage.tasks` — это `Task[]`, доменные
  // сущности, так что контракт не может просто разложить `TaskListPage` через `&`:
  // он объявляет собственную форму на `TaskDTO[]`
  export type TasksListResult =
    | { ok: true; tasks: TaskDTO[]; nextCursor: string | null }
    | TasksFailure;
  ```
  Если у типа порта нет сущностей внутри (только примитивы/строки), контракт может переиспользовать его напрямую через `import type` — этот импорт из `domain/contracts/` в `application/ports/` стирается при компиляции, так что `domain` не приобретает рантайм-зависимость от `application`, только разделяет форму типа. Это единственное исключение из правила зависимостей выше, и оно допустимо только для этого вида импорта
- Zod-схемы полей, общие с фронтендом (например, `accessTokenSchema`), — тоже в `domain/value-objects/` соответствующего модуля и реэкспортируются через barrel; фронтенд не заводит свою копию
- **Доменная сущность никогда не пересекает IPC как есть — только как DTO.** `ipcMain.handle`/`ipcRenderer.invoke` сериализуют возврат через structured clone, который копирует лишь собственные enumerable-свойства объекта верхнего уровня; геттеры, объявленные на прототипе класса (а у сущности с приватными полями это все публичные поля — см. «Сущности» выше), в клон не попадают, и на фронт бесшумно уходит объект без этих полей — без единой ошибки в рантайме, ошибка только в типах, которые продолжают врать о форме данных. Поэтому:
  - На каждую сущность, которая пересекает IPC-границу, — плоский тип-DTO в `domain/dtos/<Entity>DTO.ts` (одни данные, без методов и геттеров), повторяющий её публичную форму
  - Маппер сущности получает второй метод — `toDTO(entity): EntityDTO`, — рядом с `toDomain`, тем же классом: то, какие поля сущности видны наружу, это доменное знание, а не забота контроллера
  - `domain/contracts/*Result.ts` ссылаются на `EntityDTO`, а не на класс сущности; `<Module>IpcController` вызывает `mapper.toDTO(entity)` перед `return`, никогда не отдаёт `entity` напрямую
  - Barrel-файл (`<module>/index.ts`) экспортирует `EntityDTO`, а не класс сущности — фронтенду сама сущность (с приватными полями и методами) не нужна и не должна быть достижима
  - Правило без исключений: даже сущность с исключительно `readonly`-полями (структурно уже безопасная для structured clone) всё равно получает DTO и `toDTO`. Полагаться на то, что конкретная сущность «сейчас» без геттеров, — хрупко: следующий мутирующий метод на ней тихо сломает контракт, если явного DTO-барьера нет с самого начала


## Рецепт: как добавить функциональность

Порядок шагов — снизу вверх, от домена к границе процесса. Так тип, который в конце импортирует фронтенд, рождается один раз и в правильном слое.

### Новый модуль (например, `tasks`)

1. `domain/entities/` — сущность (`Task`), приватный конструктор, поля `readonly`/`private`+геттер, фабрики `create`/`reconstitute` (см. «Naming и структура кода»)
2. `domain/value-objects/` — value objects со `safeParse` и Zod-схемы, если поле валидируется и на фронте
3. `domain/errors/` — базовый абстрактный `TasksError extends Error` + конкретные наследники под каждый различимый снаружи случай отказа
4. `domain/mappers/` — маппер сущности: `toDomain` (сырой ответ API → сущность) и, если сущность пересекает IPC, `toDTO` (сущность → DTO, см. правило в «IPC-контракт и обработка ошибок»)
5. `domain/dtos/` — плоский `<Entity>DTO`, если сущность отдаётся наружу через IPC-контракт (без исключений для «только `readonly`-полей» — см. «IPC-контракт и обработка ошибок»)
6. `domain/contracts/` — сериализуемый discriminated union результата (`{ ok: true; ... } | { ok: false; error: { type; message } }`) и union типов ошибок; поле с сущностью типизируется как `<Entity>DTO`, не как класс сущности
7. `application/ports/` — интерфейс порта (`ITaskGateway`) с комментарием о том, какие ошибки он может бросить
8. `application/dtos/` — DTO входа/выхода use-case'а, если он не совпадает с сущностью
9. `application/use-cases/` — use-case, реализующий `UseCase<TInput, TOutput>`, зависимости через конструктор
10. `infrastructure/` — реализация порта (SDK-клиент, хранилище) и `<Module>IpcController` с `register()`; контроллер мапит сущность в DTO через `mapper.toDTO(entity)` перед `return`
11. `<module>/index.ts` — barrel: **только** контракты, DTO и общие с фронтендом Zod-схемы
12. `src/main/index.ts` — сборка зависимостей вручную в `registerIpcHandlers` и вызов `register()` у контроллера
13. `src/preload/index.ts` — новый метод в объекте `api` под ключом модуля, возвращающий `ipcRenderer.invoke("module:action", ...)`, тип результата импортируется из `../main/<module>`

Типизация `window.api` (`src/preload/global.d.ts`) выводится из объекта `api` автоматически — руками её править не нужно.

### Новый канал в существующем модуле

Шаги 4–8, 10 (только `register()` уже вызывается — добавляется лишь новая зависимость, если она появилась), 11 и 13: канал, не проброшенный в `src/preload/index.ts`, для renderer'а не существует. Шаг 12 нужен, только если у нового use-case'а появилась зависимость, которую ещё никто не собирал. Новый use-case — новый файл, не новый метод в существующем use-case'е.

### После изменений

Пройди SDLC из [`COMMON_CODE_STYLE_GUIDE.md`](COMMON_CODE_STYLE_GUIDE.md). Если появился новый модуль — проверь, не нужно ли обновить `docs/README.md` или завести ADR.


## Чего делать нельзя

- Импортировать `@doist/todoist-sdk`, читать токен или трогать `safeStorage` где-либо, кроме `src/main/*/infrastructure/`
- Пропускать исключение через границу IPC — контроллер всегда возвращает discriminated union
- Импортировать `electron` в `domain/` или `application/` — эти слои не знают о рантайме
- Заставлять `application` зависеть от `infrastructure`: use-case принимает интерфейс порта, а не конкретный класс
- Собирать зависимости где-либо, кроме `src/main/index.ts`
- Реэкспортировать из barrel'а use-case'ы, сущности с методами, реализации портов — наружу уходят только контракты, DTO и схемы
- Возвращать доменную сущность напрямую в `domain/contracts/*Result.ts` или из `<Module>IpcController` — только через `mapper.toDTO(entity)` (см. «IPC-контракт и обработка ошибок»)
- Писать бизнес-логику в `src/preload` — там только проброс `ipcRenderer.invoke`
- Опираться на <u>deadline</u>, <u>duration</u> и прочие Pro-функции Todoist


## Комментарии

Комментарии объясняют **почему**, а не что делает код — например, почему `SafeStorageTokenStore` откатывается на plaintext-хранение, а не почему он «сохраняет токен». Если убрать комментарий и смысл кода не потеряется — комментарий лишний. Также комментарий показывает, какие ошибки может выкидывать метод (актуально для портов).


## Тестирование

Обязательному покрытию unit-тестами подлежат:

- **Доменная логика** — сущности и Value Object'ы (`domain/entities/`, `domain/value-objects/`), в первую очередь там, где есть нетривиальные правила (например, разрешение конфликта Kanban-статусов в `Task.resolveStatus`, инверсия приоритета в `Priority.fromApiValue`)
- **Use case'ы** (`application/use-cases/`) — включая обработку отсутствующей/невалидной сессии (`ITokenStore.load() === null`) и делегирование в gateway с правильными аргументами

Инфраструктура (`infrastructure/`, адаптеры к `@doist/todoist-sdk`) unit-тестами не покрывается — она проверяется вручную/интеграционно, юнит-тестов на прямой вызов SDK нет смысла писать.

Конвенции:

- Тест — `*.spec.ts`, рядом с тестируемым файлом
- Тестовый раннер — Vitest; конфиг ([`vitest.config.ts`](../vitest.config.ts)) на весь проект один, `environment: "jsdom"` — при тестировании `src/main` это не мешает (Node API доступны), но модули `electron` (`ipcMain`, `app`, `safeStorage` и т.д.) нужно мокать через `vi.mock("electron", ...)`, а не полагаться на реальный рантайм — в тестовом окружении Electron не запущен
- Порты (`ITokenStore`, `ITaskGateway`, `ITodoistUserGateway`) в тестах use-case'ов мокаются напрямую (это и есть их назначение) — не тестируй use-case через реальную инфраструктуру


## Claude Code

Общие правила (SDLC, форматирование, ревью, коммит) — в [`COMMON_CODE_STYLE_GUIDE.md`](COMMON_CODE_STYLE_GUIDE.md). Специфика бэкенда:

- Реализация фичи или правки — скилл `feature-backend`
- Любой код, вызывающий Todoist API, пишется по скиллу `todoist-sdk` (сигнатуры методов, пагинация, формы ошибок), а не по памяти — SDK меняет API между мажорными версиями
