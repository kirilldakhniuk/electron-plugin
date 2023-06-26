import express from "express";
import { Menu, nativeImage } from "electron";
import { mapMenu } from "./helper";
import state from "../state";
import { menubar } from "menubar";
import { notifyLaravel } from "../utils";
import { join } from "path";

const router = express.Router();

router.post("/label", (req, res) => {
  res.sendStatus(200);

  const { label } = req.body;

  state.activeMenuBar.tray.setTitle(label);
});

router.post("/create", (req, res) => {
  res.sendStatus(200);

  const {
    id,
    width,
    height,
    url,
    alwaysOnTop,
    vibrancy,
    backgroundColor,
    transparency,
    icon,
    showDockIcon,
    contextMenu
  } = req.body;

  state.activeMenuBar = menubar({
    icon: icon || state.icon.replace("icon.png", "IconTemplate.png"),
    index: url,
    showDockIcon,
    browserWindow: {
      width,
      height,
      alwaysOnTop,
      vibrancy,
      backgroundColor,
      transparent: transparency,
      webPreferences: {
        nodeIntegration: true,
        sandbox: false,
        contextIsolation: false
      }
    }
  });
  state.activeMenuBar.on("after-create-window", () => {
    require("@electron/remote/main").enable(state.activeMenuBar.window.webContents);
  });
  state.activeMenuBar.on("ready", () => {
    state.activeMenuBar.on("show", () => {
      notifyLaravel("events", {
        event: "\\Native\\Laravel\\Events\\MenuBar\\MenuBarClicked"
      });
    });

    state.activeMenuBar.tray.on("right-click", () => {
      let menu = Menu.buildFromTemplate([{ role: "quit" }]);

      if (contextMenu) {
        const menuEntries = contextMenu.map(mapMenu);
        menu = Menu.buildFromTemplate(menuEntries);
      }

      state.activeMenuBar.tray.popUpContextMenu(menu);
    });
  });
});

export default router;
