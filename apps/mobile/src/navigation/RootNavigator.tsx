import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AppNavigator } from './AppNavigator'
import { ReviewScreen } from '../screens/learn/ReviewScreen'
import { GrammarScreen } from '../screens/grammar/GrammarScreen'
import { ExerciseScreen } from '../screens/grammar/ExerciseScreen'
import { LightColors as C } from '../lib/ThemeContext'

export type RootStackParamList = {
  Main: undefined
  Review: undefined
  Grammar: undefined
  Exercise: { topic: string; subtitle: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AppNavigator} />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Grammar"
        component={GrammarScreen}
        options={{
          headerShown: true,
          headerTitle: 'Grammatik',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: C.text },
        }}
      />
      <Stack.Screen
        name="Exercise"
        component={ExerciseScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
