export type GroupChatLocale = 'zh-CN' | 'en-US'

const LOCALE_STORAGE_KEY = 'dsh-group-chat.locale'

export function normalizeLocale(value?: string | null): GroupChatLocale {
  const raw = String(value || '').toLowerCase()
  if (raw.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

export function detectGroupChatLocale(): GroupChatLocale {
  if (typeof window === 'undefined') return 'zh-CN'
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored) return normalizeLocale(stored)
  return normalizeLocale(window.navigator?.language || window.navigator?.languages?.[0])
}

export function setGroupChatLocale(locale: GroupChatLocale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  const event = new CustomEvent('dsh-group-chat:locale-changed', {detail: {locale}})
  window.dispatchEvent(event)
  document.dispatchEvent(event)
}

export function onGroupChatLocaleChange(listener: (locale: GroupChatLocale) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: Event) => listener(normalizeLocale((event as CustomEvent).detail?.locale))
  window.addEventListener('dsh-group-chat:locale-changed', handler)
  document.addEventListener('dsh-group-chat:locale-changed', handler)
  window.addEventListener('storage', handler)
  const timer = window.setInterval(() => {
    const current = detectGroupChatLocale()
    listener(current)
  }, 1000)
  return () => {
    window.removeEventListener('dsh-group-chat:locale-changed', handler)
    document.removeEventListener('dsh-group-chat:locale-changed', handler)
    window.removeEventListener('storage', handler)
    window.clearInterval(timer)
  }
}

export function tx(locale: GroupChatLocale, zh: string, en: string): string {
  return locale === 'en-US' ? en : zh
}

export function txRoleName(member: { id: string; name: string; nameEn?: string }, locale: GroupChatLocale): string {
  if (locale === 'en-US' && member.nameEn) return member.nameEn
  return member.name || member.id
}

export function txRoleTitle(member: { title?: string; titleEn?: string }, locale: GroupChatLocale): string {
  if (locale === 'en-US' && member.titleEn) return member.titleEn
  return member.title || ''
}

export function txRoleDesc(member: { roleDescription?: string; roleDescriptionEn?: string }, locale: GroupChatLocale): string {
  if (locale === 'en-US' && member.roleDescriptionEn) return member.roleDescriptionEn
  return member.roleDescription || ''
}

