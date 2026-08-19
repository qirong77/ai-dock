import type { Provider, ProviderId } from './types'
import grokIcon from '@lobehub/icons-static-svg/icons/grok.svg'
import doubaoIcon from '@lobehub/icons-static-svg/icons/doubao-color.svg'
import geminiIcon from '@lobehub/icons-static-svg/icons/gemini-color.svg'
import qwenIcon from '@lobehub/icons-static-svg/icons/qwen-color.svg'
import deepseekIcon from '@lobehub/icons-static-svg/icons/deepseek-color.svg'
import kimiIcon from '@lobehub/icons-static-svg/icons/kimi-color.svg'
import openaiIcon from '@lobehub/icons-static-svg/icons/openai.svg'

export const PROVIDERS: Provider[] = [
  {
    id: 'grok',
    name: 'Grok',
    tagline: 'xAI · 实时联网',
    accent: '#111111',
    iconUrl: grokIcon,
    description: '来自 xAI 的模型，擅长幽默与实时信息',
    url: 'https://grok.com'
  },
  {
    id: 'doubao',
    name: '豆包',
    tagline: '字节跳动 · 中文最佳',
    accent: '#3370ff',
    iconUrl: doubaoIcon,
    description: '字节跳动自研大模型，中文理解与生成能力强',
    url: 'https://www.doubao.com/chat/'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    tagline: 'Google · 多模态',
    accent: '#4285f4',
    iconUrl: geminiIcon,
    description: 'Google 的多模态模型，图文理解能力突出',
    url: 'https://gemini.google.com/app'
  },
  {
    id: 'qwen',
    name: 'Qwen',
    tagline: '阿里云 · 通义千问',
    accent: '#615ced',
    iconUrl: qwenIcon,
    description: '阿里云通义千问官方 AI 助手',
    url: 'https://chat.qwen.ai/'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: '深度求索 · 推理模型',
    accent: '#4d6bfe',
    iconUrl: deepseekIcon,
    description: 'DeepSeek 官方 AI 助手',
    url: 'https://chat.deepseek.com/'
  },
  {
    id: 'kimi',
    name: 'Kimi',
    tagline: '月之暗面 · 长上下文',
    accent: '#171717',
    iconUrl: kimiIcon,
    description: '月之暗面 Kimi 官方 AI 助手',
    url: 'https://www.kimi.com/'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'OpenAI · 通用助手',
    accent: '#10a37f',
    iconUrl: openaiIcon,
    description: 'OpenAI ChatGPT 官方网页版',
    url: 'https://chatgpt.com/'
  }
]

export const CUSTOM_PROVIDERS_STORAGE_KEY = 'aidock.custom-providers'
const LEGACY_CUSTOM_PROVIDERS_STORAGE_KEY = 'ai-chat.custom-providers'

interface StoredCustomProvider {
  id: string
  name: string
  url: string
}

const customIcon = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M12 3.5 14 10l6.5 2-6.5 2-2 6.5-2-6.5-6.5-2 6.5-2 2-6.5Z" fill="#5b6cff"/>
  </svg>
`)}`

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function toCustomProvider(provider: StoredCustomProvider): Provider {
  return {
    id: provider.id,
    name: provider.name,
    tagline: '自定义服务',
    accent: '#5b6cff',
    iconUrl: customIcon,
    description: `${provider.name} 自定义服务`,
    url: provider.url
  }
}

export function loadCustomProviders(): Provider[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(CUSTOM_PROVIDERS_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_CUSTOM_PROVIDERS_STORAGE_KEY) ??
        '[]'
    )
    if (!Array.isArray(stored)) return []

    return stored
      .filter(
        (provider): provider is StoredCustomProvider =>
          typeof provider === 'object' &&
          provider !== null &&
          typeof provider.id === 'string' &&
          provider.id.startsWith('custom-') &&
          typeof provider.name === 'string' &&
          provider.name.trim().length > 0 &&
          typeof provider.url === 'string' &&
          isValidUrl(provider.url)
      )
      .map(toCustomProvider)
  } catch {
    return []
  }
}

export function saveCustomProviders(providers: Provider[]): void {
  const stored: StoredCustomProvider[] = providers.map(({ id, name, url }) => ({ id, name, url }))
  localStorage.setItem(CUSTOM_PROVIDERS_STORAGE_KEY, JSON.stringify(stored))
}

export function createCustomProvider(name: string, url: string): Provider {
  return toCustomProvider({
    id: `custom-${crypto.randomUUID()}`,
    name: name.trim(),
    url: url.trim()
  })
}

export function getProvider(id: ProviderId): Provider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]
}
