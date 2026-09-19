import { createContext, useContext, useState } from 'react'
import { Fonts } from './theme'

export type ThemeColors = typeof LightColors

export const LightColors = {
  primary:   '#3730A3',
  primaryD:  '#12105A',
  primaryL:  '#6366F1',
  accent:    '#F59E0B',
  accentD:   '#B45309',
  text:      '#0F172A',
  text2:     '#475569',
  text3:     '#94A3B8',
  bg:        '#F8FAFC',
  bgAlt:     '#F1F5F9',
  surface:   '#FFFFFF',
  border:    '#E2E8F0',
  success:   '#16A34A',
  error:     '#DC2626',
  warn:      '#D97706',
}

export const DarkColors: ThemeColors = {
  primary:   '#6366F1',
  primaryD:  '#1E1B6B',
  primaryL:  '#818CF8',
  accent:    '#F59E0B',
  accentD:   '#D97706',
  text:      '#F8FAFC',
  text2:     '#94A3B8',
  text3:     '#475569',
  bg:        '#0A0A14',
  bgAlt:     '#12102A',
  surface:   '#1A1830',
  border:    '#2A2845',
  success:   '#22C55E',
  error:     '#F87171',
  warn:      '#FBBF24',
}

interface ThemeCtx {
  isDark: boolean
  toggleTheme: () => void
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: false,
  toggleTheme: () => {},
  colors: LightColors,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d), colors: isDark ? DarkColors : LightColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
