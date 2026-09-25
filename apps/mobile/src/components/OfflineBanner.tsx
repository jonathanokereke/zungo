import { Animated, StyleSheet, Text, useAnimatedValue } from 'react-native'
import { useEffect } from 'react'
import { Fonts } from '../lib/theme'
import { useTheme } from '../lib/ThemeContext'

interface Props {
  isOnline: boolean
  queueLength?: number
}

export function OfflineBanner({ isOnline, queueLength = 0 }: Props) {
  const { colors: C } = useTheme()
  const opacity = useAnimatedValue(isOnline ? 0 : 1)

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isOnline])

  if (isOnline && queueLength === 0) return null

  return (
    <Animated.View
      style={[
        ob.bar,
        {
          backgroundColor: isOnline ? 'rgba(22,163,74,.9)' : 'rgba(180,83,9,.95)',
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={ob.text}>
        {isOnline
          ? queueLength > 0
            ? `Syncing ${queueLength} review${queueLength > 1 ? 's' : ''}…`
            : ''
          : queueLength > 0
            ? `Offline · ${queueLength} review${queueLength > 1 ? 's' : ''} queued`
            : 'No internet connection'}
      </Text>
    </Animated.View>
  )
}

const ob = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Fonts.semibold,
    textAlign: 'center',
  },
})
