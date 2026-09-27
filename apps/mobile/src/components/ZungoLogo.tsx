import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import { View } from 'react-native'

type Variant = 'icon' | 'wordmark'
type Scheme = 'dark' | 'light'

interface Props {
  variant?: Variant
  scheme?: Scheme
  size?: number
}

/**
 * Zungo brand mark — speech bubble with symmetric Z.
 *
 * variant="icon"     → bubble icon only (square aspect, default 64px)
 * variant="wordmark" → bubble + "zungo" text lockup (wide, default height 48px)
 * scheme="dark"      → indigo bubble on transparent (for dark/navy backgrounds)
 * scheme="light"     → indigo bubble on transparent (same — bubble is always indigo)
 */
export function ZungoLogo({ variant = 'icon', scheme = 'dark', size }: Props) {
  const INDIGO = '#3730A3'
  const WHITE = '#FFFFFF'
  const AMBER = '#F59E0B'
  const TEXT_COLOR = scheme === 'dark' ? '#FFFFFF' : '#1E1B4B'

  if (variant === 'icon') {
    // ViewBox 0 0 52 58 — bubble 52×42 with tail 16px below
    const h = size ?? 64
    const w = Math.round(h * (52 / 58))
    return (
      <View style={{ width: w, height: h }}>
        <Svg width={w} height={h} viewBox="0 0 52 58" fill="none">
          {/* Single-path speech bubble: rounded rect + integrated tail */}
          <Path
            d="M14,2 Q2,2 2,14 L2,34 Q2,46 14,46 L9,46 L4,57 L22,46 L38,46 Q50,46 50,34 L50,14 Q50,2 38,2 Z"
            fill={INDIGO}
          />
          {/* Symmetric Z: top x13→x37 y14, bottom x13→x37 y34 (24px equal spans) */}
          <Path
            d="M13 14 L37 14 L13 34 L37 34"
            stroke={WHITE}
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Amber dot at Z bottom-right terminal */}
          <Circle cx="37" cy="34" r="3.2" fill={AMBER} />
        </Svg>
      </View>
    )
  }

  // Wordmark: bubble (56×48) + "zungo" text
  // Total viewBox: 0 0 200 58
  const h = size ?? 52
  const w = Math.round(h * (200 / 58))
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox="0 0 200 58" fill="none">
        {/* Bubble */}
        <Path
          d="M14,2 Q2,2 2,14 L2,34 Q2,46 14,46 L9,46 L4,57 L22,46 L44,46 Q56,46 56,34 L56,14 Q56,2 44,2 Z"
          fill={INDIGO}
        />
        {/* Z inside bubble — proportional to icon */}
        <Path
          d="M14 13 L44 13 L14 35 L44 35"
          stroke={WHITE}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="44" cy="35" r="3.2" fill={AMBER} />
        {/* "zungo" wordmark */}
        <SvgText
          x="68"
          y="38"
          fontSize="28"
          fontWeight="800"
          fontFamily="Inter, system-ui"
          letterSpacing="-0.5"
          fill={TEXT_COLOR}
        >
          zungo
        </SvgText>
      </Svg>
    </View>
  )
}
