import path from "node:path";
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import icon from "../../resources/icon.png?asset";
import { DownloadAttachmentUseCase } from "./attachments/application/use-cases/DownloadAttachmentUseCase";
import { AttachmentsIpcController } from "./attachments/infrastructure/AttachmentsIpcController";
import { TodoistAttachmentGateway } from "./attachments/infrastructure/TodoistAttachmentGateway";
import { CheckSessionUseCase } from "./auth/application/use-cases/CheckSessionUseCase";
import { LoginUseCase } from "./auth/application/use-cases/LoginUseCase";
import { LogoutUseCase } from "./auth/application/use-cases/LogoutUseCase";
import { AuthIpcController } from "./auth/infrastructure/AuthIpcController";
import { SafeStorageTokenStore } from "./auth/infrastructure/SafeStorageTokenStore";
import { TodoistUserGateway } from "./auth/infrastructure/TodoistUserGateway";
import { CreateCommentUseCase } from "./comments/application/use-cases/CreateCommentUseCase";
import { DeleteCommentUseCase } from "./comments/application/use-cases/DeleteCommentUseCase";
import { ListCommentsUseCase } from "./comments/application/use-cases/ListCommentsUseCase";
import { UpdateCommentUseCase } from "./comments/application/use-cases/UpdateCommentUseCase";
import { CommentsIpcController } from "./comments/infrastructure/CommentsIpcController";
import { TodoistCommentGateway } from "./comments/infrastructure/TodoistCommentGateway";
import { CreateLabelUseCase } from "./labels/application/use-cases/CreateLabelUseCase";
import { ListLabelsUseCase } from "./labels/application/use-cases/ListLabelsUseCase";
import { LabelsIpcController } from "./labels/infrastructure/LabelsIpcController";
import { TodoistLabelGateway } from "./labels/infrastructure/TodoistLabelGateway";
import { ArchiveProjectUseCase } from "./projects/application/use-cases/ArchiveProjectUseCase";
import { CreateProjectUseCase } from "./projects/application/use-cases/CreateProjectUseCase";
import { DeleteProjectUseCase } from "./projects/application/use-cases/DeleteProjectUseCase";
import { GetProjectUseCase } from "./projects/application/use-cases/GetProjectUseCase";
import { ListProjectsUseCase } from "./projects/application/use-cases/ListProjectsUseCase";
import { UpdateProjectUseCase } from "./projects/application/use-cases/UpdateProjectUseCase";
import { ProjectsIpcController } from "./projects/infrastructure/ProjectsIpcController";
import { TodoistProjectGateway } from "./projects/infrastructure/TodoistProjectGateway";
import { CompleteTaskUseCase } from "./tasks/application/use-cases/CompleteTaskUseCase";
import { CountTasksCompletedTodayUseCase } from "./tasks/application/use-cases/CountTasksCompletedTodayUseCase";
import { CountTodayTasksUseCase } from "./tasks/application/use-cases/CountTodayTasksUseCase";
import { CountUnfinishedTasksUseCase } from "./tasks/application/use-cases/CountUnfinishedTasksUseCase";
import { CreateTaskUseCase } from "./tasks/application/use-cases/CreateTaskUseCase";
import { DeleteTaskUseCase } from "./tasks/application/use-cases/DeleteTaskUseCase";
import { ListTasksUseCase } from "./tasks/application/use-cases/ListTasksUseCase";
import { ListTasksWithDueDateUseCase } from "./tasks/application/use-cases/ListTasksWithDueDateUseCase";
import { ListTodayTasksUseCase } from "./tasks/application/use-cases/ListTodayTasksUseCase";
import { UpdateTaskStatusUseCase } from "./tasks/application/use-cases/UpdateTaskStatusUseCase";
import { UpdateTaskUseCase } from "./tasks/application/use-cases/UpdateTaskUseCase";
import { TasksIpcController } from "./tasks/infrastructure/TasksIpcController";
import { TodoistTaskGateway } from "./tasks/infrastructure/TodoistTaskGateway";

const appIcon = nativeImage.createFromPath(icon);

// Set once the user picks "Quit" from the tray menu (or the app quits via
// another OS-level path) — distinguishes an actual quit from the window's
// "close" event, which otherwise only hides the window into the tray.
let isQuitting = false;
let tray: Tray | null = null;

const createTray = (window: BrowserWindow) => {
  tray = new Tray(appIcon);
  tray.setToolTip("Kanbanify Todoist");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open", click: () => window.show() },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", () => window.show());
};

const registerIpcHandlers = () => {
  const userGateway = new TodoistUserGateway();
  const tokenStore = new SafeStorageTokenStore();

  const loginUseCase = new LoginUseCase(userGateway, tokenStore);
  const checkSessionUseCase = new CheckSessionUseCase(userGateway, tokenStore);
  const logoutUseCase = new LogoutUseCase(tokenStore);

  new AuthIpcController(
    loginUseCase,
    checkSessionUseCase,
    logoutUseCase,
  ).register();

  const taskGateway = new TodoistTaskGateway();
  const listTasksUseCase = new ListTasksUseCase(taskGateway, tokenStore);
  const listTasksWithDueDateUseCase = new ListTasksWithDueDateUseCase(
    taskGateway,
    tokenStore,
  );
  const listTodayTasksUseCase = new ListTodayTasksUseCase(
    taskGateway,
    tokenStore,
  );
  const updateTaskStatusUseCase = new UpdateTaskStatusUseCase(
    taskGateway,
    tokenStore,
  );
  const countUnfinishedTasksUseCase = new CountUnfinishedTasksUseCase(
    taskGateway,
    tokenStore,
  );
  const countTodayTasksUseCase = new CountTodayTasksUseCase(
    taskGateway,
    tokenStore,
  );
  const countTasksCompletedTodayUseCase = new CountTasksCompletedTodayUseCase(
    taskGateway,
    tokenStore,
  );
  const completeTaskUseCase = new CompleteTaskUseCase(taskGateway, tokenStore);
  const createTaskUseCase = new CreateTaskUseCase(taskGateway, tokenStore);
  const updateTaskUseCase = new UpdateTaskUseCase(taskGateway, tokenStore);
  const deleteTaskUseCase = new DeleteTaskUseCase(taskGateway, tokenStore);

  new TasksIpcController(
    listTasksUseCase,
    listTasksWithDueDateUseCase,
    listTodayTasksUseCase,
    updateTaskStatusUseCase,
    countUnfinishedTasksUseCase,
    countTodayTasksUseCase,
    countTasksCompletedTodayUseCase,
    completeTaskUseCase,
    createTaskUseCase,
    updateTaskUseCase,
    deleteTaskUseCase,
  ).register();

  const projectGateway = new TodoistProjectGateway();
  const listProjectsUseCase = new ListProjectsUseCase(
    projectGateway,
    taskGateway,
    tokenStore,
  );
  const getProjectUseCase = new GetProjectUseCase(
    projectGateway,
    taskGateway,
    tokenStore,
  );
  const createProjectUseCase = new CreateProjectUseCase(
    projectGateway,
    tokenStore,
  );
  const updateProjectUseCase = new UpdateProjectUseCase(
    projectGateway,
    tokenStore,
  );
  const archiveProjectUseCase = new ArchiveProjectUseCase(
    projectGateway,
    tokenStore,
  );
  const deleteProjectUseCase = new DeleteProjectUseCase(
    projectGateway,
    tokenStore,
  );

  new ProjectsIpcController(
    listProjectsUseCase,
    getProjectUseCase,
    createProjectUseCase,
    updateProjectUseCase,
    archiveProjectUseCase,
    deleteProjectUseCase,
  ).register();

  const labelGateway = new TodoistLabelGateway();
  const listLabelsUseCase = new ListLabelsUseCase(labelGateway, tokenStore);
  const createLabelUseCase = new CreateLabelUseCase(labelGateway, tokenStore);

  new LabelsIpcController(listLabelsUseCase, createLabelUseCase).register();

  const attachmentGateway = new TodoistAttachmentGateway();
  const downloadAttachmentUseCase = new DownloadAttachmentUseCase(
    attachmentGateway,
    tokenStore,
  );

  new AttachmentsIpcController(downloadAttachmentUseCase).register();

  const commentGateway = new TodoistCommentGateway();
  const listCommentsUseCase = new ListCommentsUseCase(
    commentGateway,
    tokenStore,
  );
  const createCommentUseCase = new CreateCommentUseCase(
    commentGateway,
    attachmentGateway,
    tokenStore,
  );
  const updateCommentUseCase = new UpdateCommentUseCase(
    commentGateway,
    attachmentGateway,
    tokenStore,
  );
  const deleteCommentUseCase = new DeleteCommentUseCase(
    commentGateway,
    attachmentGateway,
    tokenStore,
  );

  new CommentsIpcController(
    listCommentsUseCase,
    createCommentUseCase,
    updateCommentUseCase,
    deleteCommentUseCase,
  ).register();
};

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Closing the window ("X") minimizes to tray instead of quitting — only
  // the tray's "Quit" (or another OS-level quit path) actually exits.
  window.on("close", (event) => {
    if (isQuitting) return;

    event.preventDefault();
    window.hide();
  });

  if (!tray) {
    createTray(window);
  }
};

app.whenReady().then(() => {
  registerIpcHandlers();

  // Hides the native "File / Edit / Window / …" menu bar.
  Menu.setApplicationMenu(null);

  if (process.platform === "darwin") {
    app.dock?.setIcon(appIcon);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
