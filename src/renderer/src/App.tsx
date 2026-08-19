import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import SettingsDialog from './components/SettingsDialog'
import WebViewPanel from './components/WebViewPanel'
import { createProvider, isValidProviderInput, loadProviders, saveProviders } from './providers'
import type { Provider, ProviderId } from './types'

export default function App(): React.JSX.Element {
  const [activeId, setActiveId] = useState<ProviderId>('grok')
  const [sidebarWidth, setSidebarWidth] = useState(230)
  const [collapsed, setCollapsed] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>(loadProviders)

  // activeId 对应的服务被删除或存储变化时，回退到列表第一项
  useEffect(() => {
    if (providers.length > 0 && !providers.some((provider) => provider.id === activeId)) {
      setActiveId(providers[0].id)
    }
  }, [providers, activeId])

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

  const addProvider = (name: string, url: string): boolean => {
    if (!isValidProviderInput(name, url)) return false

    const nextProviders = [...providers, createProvider(name, url)]
    setProviders(nextProviders)
    saveProviders(nextProviders)
    return true
  }

  const removeProvider = (id: ProviderId): void => {
    if (providers.length <= 1) return
    const nextProviders = providers.filter((provider) => provider.id !== id)
    setProviders(nextProviders)
    saveProviders(nextProviders)
    if (activeId === id) setActiveId(nextProviders[0].id)
  }

  const updateProvider = (id: ProviderId, name: string, url: string): boolean => {
    if (!isValidProviderInput(name, url)) return false

    const nextProviders = providers.map((provider) =>
      provider.id === id ? { ...provider, name: name.trim(), url: url.trim() } : provider
    )
    setProviders(nextProviders)
    saveProviders(nextProviders)
    return true
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
          providers={providers}
          onAdd={addProvider}
          onRemove={removeProvider}
          onUpdate={updateProvider}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
