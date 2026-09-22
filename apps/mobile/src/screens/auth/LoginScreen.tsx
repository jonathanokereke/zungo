import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../lib/useAuth'
import { useTheme } from '../../lib/ThemeContext'
import { Fonts } from '../../lib/theme'

export function LoginScreen() {
  const { login } = useAuth()
  const { colors: C } = useTheme()
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
    <SafeAreaView style={[s.container, { backgroundColor: C.bg }]}>
      <View style={s.hero}>
        <Text style={[s.flag]}>🇩🇪</Text>
        <Text style={[s.appName, { color: C.primary }]}>Zungo</Text>
        <Text style={[s.tagline, { color: C.text2 }]}>Learn German with spaced repetition</Text>
      </View>

      <View style={s.bottom}>
        {error && (
          <Text style={[s.errorText, { color: C.error }]}>{error}</Text>
        )}
        <TouchableOpacity
          style={[s.loginBtn, { backgroundColor: C.primary }, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={s.loginBtnText}>Continue</Text>
          }
        </TouchableOpacity>
        <Text style={[s.disclaimer, { color: C.text3 }]}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  flag: { fontSize: 72, marginBottom: 16 },
  appName: { fontSize: 48, fontFamily: Fonts.bold, letterSpacing: -1 },
  tagline: { fontSize: 17, fontFamily: Fonts.regular, marginTop: 8, textAlign: 'center', lineHeight: 26 },
  bottom: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  loginBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  loginBtnText: { fontSize: 17, fontFamily: Fonts.semibold, color: '#FFFFFF' },
  errorText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center' },
  disclaimer: { fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 18 },
})
