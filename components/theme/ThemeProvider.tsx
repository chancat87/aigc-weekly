'use client'

import type { ReactNode } from 'react'
import type { ThemePreference } from './constants'
import type { ThemeContextValue } from './ThemeContext'
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { THEME_PRESETS, THEME_STORAGE_KEY } from './constants'
import { ThemeContext } from './ThemeContext'

// Safe local storage access
function getSnapshot(): ThemePreference {
  if (typeof window === 'undefined')
    return THEME_PRESETS[0].id
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored && THEME_PRESETS.some(p => p.id === stored))
    return stored as ThemePreference
  return THEME_PRESETS[0].id
}

function getServerSnapshot(): ThemePreference {
  return THEME_PRESETS[0].id
}

// Since localStorage doesn't trigger storage event for same window,
// we need a custom dispatch mechanism.
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  // Also listen to storage events from other tabs
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      callback()
    }
  }
  if (typeof window !== 'undefined')
    window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(callback)
    if (typeof window !== 'undefined')
      window.removeEventListener('storage', onStorage)
  }
}

function updateThemeInStorage(theme: ThemePreference) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
    // Notify listeners
    listeners.forEach(l => l())
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore handles the initial state and hydration mismatch logic safely
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const updateTheme = useCallback((value: ThemePreference) => {
    updateThemeInStorage(value)
  }, [])

  const toggleTheme = useCallback(() => {
    const current = getSnapshot() // Get latest value directly
    const index = THEME_PRESETS.findIndex(preset => preset.id === current)
    const next = THEME_PRESETS[(index + 1) % THEME_PRESETS.length]
    updateThemeInStorage(next.id)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: updateTheme, toggleTheme, themes: THEME_PRESETS }),
    [theme, updateTheme, toggleTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
