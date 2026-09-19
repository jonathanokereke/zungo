import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { DashboardScreen } from '../screens/dashboard/DashboardScreen'
import { LearnScreen } from '../screens/learn/LearnScreen'
import { ChatScreen } from '../screens/chat/ChatScreen'
import { ProgressScreen } from '../screens/progress/ProgressScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { Icons } from '../lib/icons'
import { Fonts } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'

const Tab = createBottomTabNavigator()

export function AppNavigator() {
  const { colors } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 4,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.medium,
        },
        tabBarIcon: ({ color, size }) => {
          const s = size - 2
          if (route.name === 'Home')     return <Icons.Home size={s} color={color} />
          if (route.name === 'Learn')    return <Icons.BookOpen size={s} color={color} />
          if (route.name === 'Chat')     return <Icons.MessageSquare size={s} color={color} />
          if (route.name === 'Progress') return <Icons.BarChart2 size={s} color={color} />
          if (route.name === 'Profile')  return <Icons.User size={s} color={color} />
          return null
        },
      })}
    >
      <Tab.Screen name="Home"     component={DashboardScreen} />
      <Tab.Screen name="Learn"    component={LearnScreen} />
      <Tab.Screen name="Chat"     component={ChatScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  )
}
