import { useState } from 'react'
import type { Provider, ProviderId } from '../types'

interface SettingsDialogProps {
  providers: Provider[]
  onAdd: (name: string, url: string) => boolean
  onRemove: (id: ProviderId) => void
  onUpdate: (id: ProviderId, name: string, url: string) => boolean
  onClose: () => void
}

export default function SettingsDialog({
  providers,
  onAdd,
  onRemove,
  onUpdate,
  onClose
}: SettingsDialogProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<ProviderId | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editError, setEditError] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (onAdd(name, url)) {
      setName('')
      setUrl('')
      setError('')
      return
    }
    setError('请输入名称和有效的 http(s) 地址')
  }

  const startEdit = (provider: Provider): void => {
    setEditingId(provider.id)
    setEditName(provider.name)
    setEditUrl(provider.url)
    setEditError('')
  }

  const cancelEdit = (): void => {
    setEditingId(null)
    setEditError('')
  }

  const saveEdit = (): void => {
    if (editingId && onUpdate(editingId, editName, editUrl)) {
      setEditingId(null)
      setEditError('')
      return
    }
    setEditError('请输入名称和有效的 http(s) 地址')
  }

  const onlyOne = providers.length <= 1

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="settings-header">
          <div>
            <h2 id="settings-title">AI 配置</h2>
            <p>管理 AI 服务及其访问地址，至少保留一个</p>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="关闭设置">×</button>
        </header>

        <div className="settings-list" aria-label="已配置的 AI 服务">
          {providers.map((provider) => (
            <div
              className={`settings-row${editingId === provider.id ? ' editing' : ''}`}
              key={provider.id}
            >
              {editingId === provider.id ? (
                <div className="settings-edit">
                  <label>
                    名称
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                    />
                  </label>
                  <label>
                    地址
                    <input
                      value={editUrl}
                      onChange={(event) => setEditUrl(event.target.value)}
                      inputMode="url"
                      placeholder="https://example.com"
                    />
                  </label>
                  {editError && <p className="settings-form-error">{editError}</p>}
                  <div className="settings-edit-actions">
                    <button type="button" className="settings-cancel" onClick={cancelEdit}>取消</button>
                    <button type="button" className="settings-save" onClick={saveEdit}>保存</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="settings-service">
                    <strong>{provider.name}</strong>
                  </div>
                  <span className="settings-url" title={provider.url}>{provider.url}</span>
                  <div className="settings-actions">
                    <button
                      type="button"
                      className="settings-edit-btn"
                      onClick={() => startEdit(provider)}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="settings-delete"
                      disabled={onlyOne}
                      title={onlyOne ? '至少保留一个服务' : undefined}
                      onClick={() => onRemove(provider.id)}
                    >
                      删除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <form className="settings-form" onSubmit={submit}>
          <h3>新增 AI 服务</h3>
          <label>
            名称
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：Claude" />
          </label>
          <label>
            地址
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" inputMode="url" />
          </label>
          {error && <p className="settings-form-error">{error}</p>}
          <button type="submit" className="settings-submit">添加服务</button>
        </form>
      </section>
    </div>
  )
}
