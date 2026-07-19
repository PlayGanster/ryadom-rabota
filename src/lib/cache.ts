const store = new Map<string, { data: unknown; ts: number }>()

export function getCache<T = unknown>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined
}

export function setCache<T = unknown>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

export function hasCache(key: string): boolean {
  return store.has(key)
}

export function clearCache(key?: string): void {
  if (key) store.delete(key)
  else store.clear()
}
