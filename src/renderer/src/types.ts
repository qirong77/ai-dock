export type ProviderId = string

export interface Provider {
  id: ProviderId
  name: string
  tagline: string
  accent: string
  /** 本地打包的品牌图标资源或 data URL */
  iconUrl: string
  description: string
  /** 该模型官方网页版地址，用于 webview 内嵌 */
  url: string
}
