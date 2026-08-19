import { app, shell, BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

let isQuitting = false

app.setName('AIDock')

// 去掉 Electron/应用名标识，改善第三方站点在 WebView 中的兼容性。
// Google 账号授权仍必须转交系统浏览器，不能依赖 UA 伪装绕过其嵌入式浏览器限制。
app.userAgentFallback = app.userAgentFallback
  .replace(/\s*Electron\/[\d.]+/g, '')
  .replace(/\s*AIDock\/[\d.]+/gi, '')

// 开发/未打包时用源码图标，保证窗口与 Dock 图标和打包产物一致；
// 打包后 build/ 不在 asar 中，系统会自动使用 .icns/.ico，这里返回 undefined
function resolveIconPath(): string | undefined {
  const icon = join(app.getAppPath(), 'build/icon.png')
  return existsSync(icon) ? icon : undefined
}

function isGoogleAuthUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' && url.hostname === 'accounts.google.com'
  } catch {
    return false
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'AIDock',
    icon: resolveIconPath(),
    webPreferences: {
      // package.json 使用 ESM，electron-vite 因此将 preload 输出为 index.mjs。
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // 允许 renderer 使用 <webview> 标签内嵌第三方站点
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // 允许普通站点的 webview 弹窗在应用内创建；Google 授权在上面单独转交
  // 系统浏览器，因为 Google 不支持嵌入式账号登录。
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      // 双保险：guest 与它创建的登录窗口都使用不含 Electron 标识的 UA。
      contents.setUserAgent(app.userAgentFallback)

      // Google 不允许在嵌入式 user-agent 中完成账号授权。这里拦截 WebView
      // 的直接导航和重定向，交给用户的默认浏览器，避免出现“此浏览器或应用
      // 可能不安全”的拒绝页。系统浏览器中的 Gemini 会独立保存登录状态。
      const openGoogleAuthExternally = (event: Electron.Event, url: string): void => {
        if (!isGoogleAuthUrl(url)) return
        event.preventDefault()
        void shell.openExternal(url)
      }
      contents.on('will-navigate', openGoogleAuthExternally)
      contents.on('will-redirect', openGoogleAuthExternally)

      contents.setWindowOpenHandler(({ url }) => {
        if (isGoogleAuthUrl(url)) {
          void shell.openExternal(url)
          return { action: 'deny' }
        }

        let protocol: string
        try {
          protocol = new URL(url).protocol
        } catch {
          return { action: 'deny' }
        }

        if (protocol !== 'https:' && protocol !== 'http:') {
          return { action: 'deny' }
        }

        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 520,
            height: 720,
            autoHideMenuBar: true,
            webPreferences: {
              // 弹窗必须与发起它的 webview 共用 cookie/storage，
              // 否则普通站点完成登录后原页面仍会保持未登录状态。
              session: contents.session,
              nodeIntegration: false,
              contextIsolation: true,
              sandbox: true,
              webviewTag: false
            }
          }
        }
      })
    }
  })

  if (process.platform === 'darwin' && !app.isPackaged) {
    const icon = resolveIconPath()
    if (icon) app.dock?.setIcon(icon)
  }
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    const windows = BrowserWindow.getAllWindows()
    if (windows.length === 0) {
      createWindow()
    } else {
      windows[0].show()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
