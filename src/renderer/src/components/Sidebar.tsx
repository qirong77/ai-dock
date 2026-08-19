import { useMemo, useState } from 'react'
import type { Provider, ProviderId } from '../types'

const PROVIDER_ORDER_STORAGE_KEY = 'aidock.provider-order'
const LEGACY_PROVIDER_ORDER_STORAGE_KEY = 'ai-chat.provider-order'

function getSavedProviderOrder(providers: Provider[]): ProviderId[] {
  const defaultOrder = providers.map((provider) => provider.id)

  try {
    const savedOrder: unknown = JSON.parse(
      localStorage.getItem(PROVIDER_ORDER_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_PROVIDER_ORDER_STORAGE_KEY) ??
        '[]'
    )
    if (!Array.isArray(savedOrder)) return defaultOrder

    const validSavedOrder = savedOrder.filter((id): id is ProviderId =>
      typeof id === 'string' && defaultOrder.includes(id as ProviderId)
    )
    const missingProviders = defaultOrder.filter((id) => !validSavedOrder.includes(id))

    return [...new Set([...validSavedOrder, ...missingProviders])]
  } catch {
    return defaultOrder
  }
}

interface SidebarProps {
  providers: Provider[]
  activeId: ProviderId
  collapsed: boolean
  width: number
  onSelect: (id: ProviderId) => void
  onToggle: () => void
  onResizeStart: () => void
  onOpenSettings: () => void
}

export default function Sidebar({
  providers,
  activeId,
  collapsed,
  width,
  onSelect,
  onToggle,
  onResizeStart,
  onOpenSettings
}: SidebarProps): React.JSX.Element {
  const [providerOrder, setProviderOrder] = useState<ProviderId[]>(() => getSavedProviderOrder(providers))
  const [draggedId, setDraggedId] = useState<ProviderId | null>(null)
  const [dropTargetId, setDropTargetId] = useState<ProviderId | null>(null)

  const orderedProviders = useMemo(
    () =>
      providerOrder
        .map((id) => providers.find((provider) => provider.id === id))
        .filter((provider): provider is Provider => Boolean(provider))
        .concat(providers.filter((provider) => !providerOrder.includes(provider.id))),
    [providerOrder, providers]
  )

  const saveProviderOrder = (nextOrder: ProviderId[]): void => {
    setProviderOrder(nextOrder)
    localStorage.setItem(PROVIDER_ORDER_STORAGE_KEY, JSON.stringify(nextOrder))
  }

  const handleDrop = (targetId: ProviderId): void => {
    if (!draggedId || draggedId === targetId) return

    const nextOrder = [...providerOrder]
    const draggedIndex = nextOrder.indexOf(draggedId)
    const targetIndex = nextOrder.indexOf(targetId)
    nextOrder.splice(draggedIndex, 1)
    nextOrder.splice(targetIndex, 0, draggedId)
    saveProviderOrder(nextOrder)
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} style={{ width: collapsed ? 64 : width }}>
      <div className="sidebar-brand">
        <span className="brand-logo">AI</span>
        <div className="brand-copy">
          <div className="brand-title">AIDock</div>
          <div className="brand-sub">AI workspace</div>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
          title={collapsed ? '展开侧栏' : '折叠侧栏'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
          </svg>
        </button>
      </div>

      <div className="sidebar-section-label">Provider</div>
      <nav className="provider-list">
        {orderedProviders.map((p) => (
          <button
            key={p.id}
            type="button"
            draggable
            className={`provider-item${activeId === p.id ? ' active' : ''}${draggedId === p.id ? ' dragging' : ''}${dropTargetId === p.id ? ' drag-over' : ''}`}
            style={activeId === p.id ? ({ '--accent': p.accent } as React.CSSProperties) : undefined}
            onClick={() => onSelect(p.id)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', p.id)
              setDraggedId(p.id)
            }}
            onDragOver={(event) => {
              if (draggedId && draggedId !== p.id) {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDropTargetId(p.id)
              }
            }}
            onDragLeave={() => {
              if (dropTargetId === p.id) setDropTargetId(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(p.id)
              setDropTargetId(null)
            }}
            onDragEnd={() => {
              setDraggedId(null)
              setDropTargetId(null)
            }}
            title={p.description}
          >
            <span
              className={`provider-icon provider-icon-${p.id}`}
              style={{ '--icon-tint': p.accent } as React.CSSProperties}
            >
              <img src={p.iconUrl} alt="" />
            </span>
            <span className="provider-info">
              <span className="provider-name">{p.name}</span>
            </span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-settings"
        onClick={onOpenSettings}
        aria-label="管理 AI 配置"
        title="管理 AI 配置"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>设置</span>
      </button>
      <div
        className="sidebar-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整侧栏宽度"
        onPointerDown={onResizeStart}
      />
    </aside>
  )
}
