import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import SettingsDialog from './components/SettingsDialog'
import WebViewPanel from './components/WebViewPanel'
import { createCustomProvider, loadCustomProviders, PROVIDERS, saveCustomProviders } from './providers'
import type { Provider, ProviderId } from './types'

export default function App(): React.JSX.Element {
  const [activeId, setActiveId] = useState<ProviderId>('grok')
  const [sidebarWidth, setSidebarWidth] = useState(230)
  const [collapsed, setCollapsed] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customProviders, setCustomProviders] = useState<Provider[]>(loadCustomProviders)
  const providers = [...PROVIDERS, ...customProviders]

  useEffect(() => {
    if (!resizing) return

    const resize = (event: PointerEvent): void => {
      setSidebarWidth(Math.min(420, Math.max(200, event.clientX)))
    }
    const stopResize = (): void => setResizing(false)

    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stopResize)
    return () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stopResize)
    }
  }, [resizing])

  const addCustomProvider = (name: string, url: string): boolean => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    try {
      const parsedUrl = new URL(trimmedUrl)
      if (!trimmedName || !['https:', 'http:'].includes(parsedUrl.protocol)) return false
    } catch {
      return false
    }

    const nextProviders = [...customProviders, createCustomProvider(trimmedName, trimmedUrl)]
    setCustomProviders(nextProviders)
    saveCustomProviders(nextProviders)
    return true
  }

  const removeCustomProvider = (id: ProviderId): void => {
    const nextProviders = customProviders.filter((provider) => provider.id !== id)
    setCustomProviders(nextProviders)
    saveCustomProviders(nextProviders)
    if (activeId === id) setActiveId(PROVIDERS[0].id)
  }

  return (
    <div className={`app${resizing ? ' is-resizing' : ''}`}>
      <Sidebar
        providers={providers}
        activeId={activeId}
        collapsed={collapsed}
        width={sidebarWidth}
        onSelect={setActiveId}
        onToggle={() => setCollapsed((value) => !value)}
        onResizeStart={() => !collapsed && setResizing(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="main">
        {providers.map((p) => (
          <WebViewPanel key={p.id} provider={p} active={p.id === activeId} />
        ))}
      </main>
      {settingsOpen && (
        <SettingsDialog
          customProviders={customProviders}
          onAdd={addCustomProvider}
          onRemove={removeCustomProvider}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
