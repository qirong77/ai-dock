import { useEffect, useRef, useState } from 'react'
import type { Provider } from '../types'

interface WebViewPanelProps {
  provider: Provider
  active: boolean
}

/**
 * 用 Electron <webview> 内嵌 AI 官方网页版。
 * 相比 iframe，webview 不受目标站点 X-Frame-Options / CSP frame-ancestors 限制，
 * 且是独立渲染进程，可保留登录态；三个面板常驻，切换时只改显隐，保留各自页面状态。
 */
export default function WebViewPanel({ provider, active }: WebViewPanelProps): React.JSX.Element {
  const ref = useRef<Electron.WebviewTag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const wv = ref.current
    if (!wv) return

    let shadowObserver: MutationObserver | undefined
    let observedShadowRoot: ShadowRoot | null = null

    // Electron 将实际承载页面的 iframe 放在 webview 的开放 Shadow DOM 中。
    // webview 在首次挂载或导航后可能重建该 iframe，因此需要直接设置并持续同步。
    const setIframeHeight = (): void => {
      const iframe = wv.shadowRoot?.querySelector('iframe')
      if (!(iframe instanceof HTMLIFrameElement)) return

      iframe.style.setProperty('height', '100%', 'important')
      iframe.style.setProperty('min-height', '100%', 'important')
    }

    const observeShadowDom = (): void => {
      const shadowRoot = wv.shadowRoot
      if (!shadowRoot || shadowRoot === observedShadowRoot) {
        setIframeHeight()
        return
      }

      shadowObserver?.disconnect()
      observedShadowRoot = shadowRoot
      shadowObserver = new MutationObserver(setIframeHeight)
      shadowObserver.observe(shadowRoot, { childList: true, subtree: true })
      setIframeHeight()
    }

    const onStart = (): void => {
      setLoading(true)
      setError(null)
      observeShadowDom()
    }
    const onStop = (): void => {
      setLoading(false)
      observeShadowDom()
    }
    const onFail = (e: Electron.DidFailLoadEvent): void => {
      if (e.isMainFrame) {
        setError(e.errorDescription || '加载失败')
        setLoading(false)
      }
    }

    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-fail-load', onFail)
    wv.addEventListener('dom-ready', observeShadowDom)
    observeShadowDom()

    return () => {
      shadowObserver?.disconnect()
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-fail-load', onFail)
      wv.removeEventListener('dom-ready', observeShadowDom)
    }
  }, [])

  const retry = (): void => {
    setError(null)
    ref.current?.reload()
  }

  return (
    <div className={`webview-panel${active ? ' active' : ''}`} aria-hidden={!active}>
      {active && loading && (
        <div className="webview-loading">
          <span className="spinner" style={{ borderTopColor: provider.accent }} />
          正在加载 {provider.name} …
        </div>
      )}
      {active && error && (
        <div className="webview-error">
          <p>无法加载 {provider.name}：{error}</p>
          <button type="button" onClick={retry}>重试</button>
        </div>
      )}
      <webview
        ref={ref}
        src={provider.url}
        partition="persist:aidock"
        // React 会丢弃未知 DOM 属性的布尔值；字符串才能真正写入
        // allowpopups 属性。Electron 的 JSX 类型仍将它声明为 boolean。
        allowpopups={'true' as unknown as boolean}
        className="webview"
      />
    </div>
  )
}