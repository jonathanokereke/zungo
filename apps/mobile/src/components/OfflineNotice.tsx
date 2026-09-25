import { StyleSheet, Text, View } from 'react-native'
import { Fonts } from '../lib/theme'
import { Icons } from '../lib/icons'

interface Props {
  message?: string
}

export function OfflineNotice({ message = 'This feature requires an internet connection.' }: Props) {
  return (
    <View style={on.bar}>
      <Icons.Globe size={14} color='#92400E' />
      <Text style={on.text}>{message}</Text>
    </View>
  )
}

const on = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,.35)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#92400E',
    lineHeight: 18,
  },
})
