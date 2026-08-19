import { contextBridge, ipcRenderer } from 'electron'

const api = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  ping: (): Promise<string> => ipcRenderer.invoke('ping')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
