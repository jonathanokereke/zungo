import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { API_BASE } from './api'

async function probe(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${API_BASE}/health`, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

interface NetworkCtx {
  isOnline: boolean
  recheckNow: () => Promise<boolean>
}

const Ctx = createContext<NetworkCtx>({ isOnline: true, recheckNow: async () => true })

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = useCallback(async () => {
    const online = await probe()
    setIsOnline(online)
    return online
  }, [])

  useEffect(() => {
    check()
    intervalRef.current = setInterval(check, 12_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [check])

  return <Ctx.Provider value={{ isOnline, recheckNow: check }}>{children}</Ctx.Provider>
}

export function useNetwork() { return useContext(Ctx) }
