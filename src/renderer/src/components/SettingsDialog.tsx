import { useState } from 'react'
import { PROVIDERS } from '../providers'
import type { Provider } from '../types'

interface SettingsDialogProps {
  customProviders: Provider[]
  onAdd: (name: string, url: string) => boolean
  onRemove: (id: string) => void
  onClose: () => void
}

export default function SettingsDialog({
  customProviders,
  onAdd,
  onRemove,
  onClose
}: SettingsDialogProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

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
            <p>管理自定义 AI 服务及其访问地址</p>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="关闭设置">×</button>
        </header>

        <div className="settings-list" aria-label="已配置的 AI 服务">
          {PROVIDERS.map((provider) => (
            <div className="settings-row" key={provider.id}>
              <div className="settings-service">
                <strong>{provider.name}</strong>
                <span>内置</span>
              </div>
              <span className="settings-url" title={provider.url}>{provider.url}</span>
            </div>
          ))}
          {customProviders.map((provider) => (
            <div className="settings-row" key={provider.id}>
              <div className="settings-service">
                <strong>{provider.name}</strong>
                <span>自定义</span>
              </div>
              <span className="settings-url" title={provider.url}>{provider.url}</span>
              <button type="button" className="settings-delete" onClick={() => onRemove(provider.id)}>删除</button>
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
