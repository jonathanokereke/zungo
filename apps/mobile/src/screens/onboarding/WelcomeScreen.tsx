import { useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Fonts } from '../../lib/theme'
import { useTheme } from '../../lib/ThemeContext'
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator'

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>()
  const { colors: C } = useTheme()
  const [name, setName] = useState('')

  function proceed() {
    const trimmed = name.trim()
    if (!trimmed) return
    navigation.navigate('LevelPicker', { preferred_name: trimmed })
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.primaryD }]}>
      <View style={s.circle1} />
      <View style={s.circle2} />

      <View style={s.content}>
        <Text style={s.flag}>🇩🇪</Text>
        <Text style={s.title}>Willkommen!</Text>
        <Text style={[s.subtitle, { color: 'rgba(255,255,255,.75)' }]}>
          What should we call you?
        </Text>
        <TextInput
          style={[s.nameInput, { backgroundColor: 'rgba(255,255,255,.12)', color: '#FFFFFF', borderColor: name.trim() ? C.accent : 'rgba(255,255,255,.25)' }]}
          placeholder="Your first name"
          placeholderTextColor="rgba(255,255,255,.4)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={proceed}
        />
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.accent, opacity: name.trim() ? 1 : 0.45 }]}
          onPress={proceed}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,.04)', top: -80, right: -80 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(245,158,11,.08)', bottom: 100, left: -60 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 48, justifyContent: 'center', gap: 16 },
  flag: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 42, fontFamily: Fonts.bold, color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 18, fontFamily: Fonts.regular, textAlign: 'center', marginBottom: 8 },
  nameInput: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 18, paddingVertical: 16, fontSize: 17, fontFamily: Fonts.regular },
  footer: { paddingHorizontal: 28, paddingBottom: 24 },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 17, fontFamily: Fonts.bold, color: '#1E1B4B' },
})
