import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { IntroScreen } from '../screens/onboarding/IntroScreen'
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen'
import { LevelPickerScreen } from '../screens/onboarding/LevelPickerScreen'
import { AssessmentScreen } from '../screens/onboarding/AssessmentScreen'
import { GoalScreen } from '../screens/onboarding/GoalScreen'

export type OnboardingStackParamList = {
  Intro: undefined
  Welcome: undefined
  LevelPicker: { preferred_name: string }
  Assessment: { preferred_name: string }
  Goal: { preferred_name: string; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' }
}

const Stack = createNativeStackNavigator<OnboardingStackParamList>()

export function OnboardingNavigator({ onComplete }: { onComplete: () => void }) {
  return (
    <Stack.Navigator id="OnboardingNavigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LevelPicker" component={LevelPickerScreen} />
      <Stack.Screen name="Assessment" component={AssessmentScreen} />
      <Stack.Screen name="Goal">
        {props => <GoalScreen {...props} onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
