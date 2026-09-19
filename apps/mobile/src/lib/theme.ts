// Colors are now managed by ThemeContext (light/dark).
// Import useTheme() to get the current colors: const { colors: C } = useTheme()
// LightColors is exported here for non-component use (StyleSheet defaults etc).
export { LightColors as Colors } from './ThemeContext'

export const Fonts = {
  regular:    'OpenSans_400Regular',
  medium:     'OpenSans_500Medium',
  semibold:   'OpenSans_600SemiBold',
  bold:       'OpenSans_700Bold',
  italic:     'OpenSans_400Regular_Italic',
}
