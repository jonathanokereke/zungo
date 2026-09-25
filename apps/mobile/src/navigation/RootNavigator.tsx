import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AppNavigator } from './AppNavigator'
import { ReviewScreen } from '../screens/learn/ReviewScreen'
import { GrammarScreen } from '../screens/grammar/GrammarScreen'
import { ExerciseScreen } from '../screens/grammar/ExerciseScreen'
import { ChatScreen } from '../screens/chat/ChatScreen'
import { ReadScreen } from '../screens/read/ReadScreen'
import { VocabularyScreen } from '../screens/vocabulary/VocabularyScreen'
import { ShadowScreen } from '../screens/shadow/ShadowScreen'
import { LightColors as C } from '../lib/ThemeContext'

export type RootStackParamList = {
  Main: undefined
  Review: undefined
  Grammar: undefined
  Exercise: { topic: string; subtitle: string }
  Chat: undefined
  Read: undefined
  Vocabulary: { pos?: string } | undefined
  Shadow: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  return (
    <Stack.Navigator id="RootNavigator" screenOptions={{ headerShown: false }}>
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
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          headerTitle: 'Conversation',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: C.text },
        }}
      />
      <Stack.Screen
        name="Read"
        component={ReadScreen}
        options={{
          headerShown: true,
          headerTitle: 'Lesen',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: C.text },
        }}
      />
      <Stack.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          headerShown: true,
          headerTitle: 'Vokabular',
          headerTintColor: C.primary,
          headerStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: C.text },
        }}
      />
      <Stack.Screen
        name="Shadow"
        component={ShadowScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
