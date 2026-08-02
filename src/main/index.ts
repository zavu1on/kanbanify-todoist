import path from "node:path";
import { app, BrowserWindow, nativeImage } from "electron";
import icon from "../../resources/icon.png?asset";
import { LoginUseCase } from "./auth/application/use-cases/LoginUseCase";
import { AuthIpcController } from "./auth/infrastructure/AuthIpcController";
import { SafeStorageTokenStore } from "./auth/infrastructure/SafeStorageTokenStore";
import { TodoistUserGateway } from "./auth/infrastructure/TodoistUserGateway";

const appIcon = nativeImage.createFromPath(icon);

const registerIpcHandlers = () => {
  const loginUseCase = new LoginUseCase(
    new TodoistUserGateway(),
    new SafeStorageTokenStore(),
  );

  new AuthIpcController(loginUseCase).register();
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
