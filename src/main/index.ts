import path from "node:path";
import { app, BrowserWindow, nativeImage } from "electron";
import icon from "../../resources/icon.png?asset";
import { CheckSessionUseCase } from "./auth/application/use-cases/CheckSessionUseCase";
import { LoginUseCase } from "./auth/application/use-cases/LoginUseCase";
import { LogoutUseCase } from "./auth/application/use-cases/LogoutUseCase";
import { AuthIpcController } from "./auth/infrastructure/AuthIpcController";
import { SafeStorageTokenStore } from "./auth/infrastructure/SafeStorageTokenStore";
import { TodoistUserGateway } from "./auth/infrastructure/TodoistUserGateway";
import { ListTasksUseCase } from "./tasks/application/use-cases/ListTasksUseCase";
import { UpdateTaskStatusUseCase } from "./tasks/application/use-cases/UpdateTaskStatusUseCase";
import { TasksIpcController } from "./tasks/infrastructure/TasksIpcController";
import { TodoistTaskGateway } from "./tasks/infrastructure/TodoistTaskGateway";

const appIcon = nativeImage.createFromPath(icon);

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
  const updateTaskStatusUseCase = new UpdateTaskStatusUseCase(
    taskGateway,
    tokenStore,
  );

  new TasksIpcController(listTasksUseCase, updateTaskStatusUseCase).register();
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
};

app.whenReady().then(() => {
  registerIpcHandlers();

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
