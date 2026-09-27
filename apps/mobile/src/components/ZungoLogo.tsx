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
 * Canonical geometry (52×54 viewBox for icon):
 *   Bubble: single path, tail blends seamlessly at bottom-left
 *   Z: x18→x34 top and bottom (16px equal spans, centred in bubble)
 *   Dot: amber circle at Z bottom-right terminal
 *
 * variant="icon"     → bubble icon only (default height 64px)
 * variant="wordmark" → bubble + "zungo" text lockup (default height 48px)
 * scheme="light"     → text colour switches to navy for light backgrounds
 */
export function ZungoLogo({ variant = 'icon', scheme = 'dark', size }: Props) {
  const INDIGO = '#3730A3'
  const WHITE = '#FFFFFF'
  const AMBER = '#F59E0B'
  const TEXT_COLOR = scheme === 'dark' ? '#FFFFFF' : '#1E1B4B'

  if (variant === 'icon') {
    const h = size ?? 64
    const w = Math.round(h * (52 / 54))
    return (
      <View style={{ width: w, height: h }}>
        <Svg width={w} height={h} viewBox="0 0 52 54" fill="none">
          {/*
            Single-path bubble: rounded rect body (x4→x48 y4→y40 rx10)
            with integrated tail. Tail base sits on the same y=40 line as the
            rect bottom so there is no seam — one continuous filled shape.
            Tail base: x10–x22 on y=40. Tip: x7 y51.
          */}
          <Path
            d="M14,4 Q4,4 4,14 L4,30 Q4,40 14,40 L10,40 L7,51 L22,40 L38,40 Q48,40 48,30 L48,14 Q48,4 38,4 Z"
            fill={INDIGO}
          />
          {/*
            Symmetric Z: equal 16px horizontal spans.
            Top:    x18 → x34  y14
            Diag:   x34,y14 → x18,y30
            Bottom: x18 → x34  y30
            Inset 14px from both sides of the bubble (bubble x: 4–48).
          */}
          <Path
            d="M18 14 L34 14 L18 30 L34 30"
            stroke={WHITE}
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx="34" cy="30" r="3" fill={AMBER} />
        </Svg>
      </View>
    )
  }

  // Wordmark: same bubble (viewBox 0 0 132 44), Z scaled proportionally
  const h = size ?? 48
  const w = Math.round(h * (132 / 44))
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox="0 0 132 44" fill="none">
        {/*
          Bubble: rect region x2→x38 y2→y30 rx8.
          Tail base x6–x17 on y=30. Tip x4 y42.
          Same single-path, seamless approach.
        */}
        <Path
          d="M10,2 Q2,2 2,10 L2,22 Q2,30 10,30 L6,30 L4,42 L17,30 L30,30 Q38,30 38,22 L38,10 Q38,2 30,2 Z"
          fill={INDIGO}
        />
        {/*
          Z proportional to icon: 13px equal spans.
          Top:    x12 → x25  y10
          Bottom: x12 → x25  y22
          Inset 10px from bubble sides (bubble x: 2–38).
        */}
        <Path
          d="M12 10 L25 10 L12 22 L25 22"
          stroke={WHITE}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="25" cy="22" r="2.1" fill={AMBER} />
        <SvgText
          x="48"
          y="26"
          fontSize="20"
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
