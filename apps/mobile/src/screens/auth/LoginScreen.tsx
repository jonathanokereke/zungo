import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../lib/useAuth'
import { Fonts } from '../../lib/theme'

const OFF_WHITE = '#F9F8F6'
const NAVY = '#12105A'
const AMBER = '#F59E0B'
const MUTED = '#9CA3AF'
const TEXT2 = '#6B7280'

export function LoginScreen() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      await login()
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.hero}>
        <View style={s.logoMark}>
          <Text style={s.logoZ}>Z</Text>
        </View>
        <Text style={s.logoName}>Zungo</Text>
        <View style={s.divider} />
        <Text style={s.headline}>German fluency,{'\n'}the smart way.</Text>
        <Text style={s.tagline}>
          Vocabulary, writing, and grammar —{'\n'}personalised to your level.
        </Text>
      </View>

      <View style={s.bottom}>
        {error && <Text style={s.errorText}>{error}</Text>}
        <TouchableOpacity
          style={[s.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.loginBtnText}>Continue</Text>
          }
        </TouchableOpacity>
        <Text style={s.disclaimer}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: OFF_WHITE },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoZ: { fontSize: 40, fontFamily: Fonts.bold, color: AMBER, fontStyle: 'italic' },
  logoName: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: NAVY,
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: AMBER,
    borderRadius: 2,
    marginBottom: 28,
  },
  headline: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: NAVY,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: TEXT2,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  loginBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: NAVY,
  },
  loginBtnText: { fontSize: 17, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  errorText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', color: '#EF4444' },
  disclaimer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
})
