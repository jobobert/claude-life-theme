import type { Register, ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Deep blue-black surfaces, mint accent: a lab board at night.
const { theme, problems } = makeColors({
  label: 'Life',
  only: 'dark',
  roles: { accent: '#3ee6a8', danger: '#ff6b7a', success: '#7bd88f', warning: '#f0b860', pro: '#b392f0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0a0f14',
        'surface-1': '#10171e',
        'surface-2': '#151e26',
        'surface-3': '#1a242e',
        'text-primary': '#e6f1ee',
        'text-secondary': '#b4c6c1',
        'text-muted': '#8fa39e',
      },
    },
  },
})

// The still scene: shown on mobile, under Reduce Motion, or wherever the shader does not play.
// A fixed board with a few gliders and blinkers resting toward the edges.
const CELL = 14
const W = 1440
const H = 900
const PATTERNS: Array<[number, number, Array<[number, number]>]> = [
  [6, 6, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]],
  [90, 10, [[0, 0], [1, 0], [2, 0]]],
  [12, 48, [[0, 0], [1, 0], [0, 1], [1, 1]]],
  [86, 50, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]],
  [20, 26, [[0, 1], [1, 1], [2, 1]]],
  [96, 30, [[0, 0], [1, 0], [0, 1], [3, 2], [2, 3], [3, 3]]],
  [4, 34, [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]],
  [70, 58, [[0, 0], [1, 0], [2, 0], [2, 1], [1, 2]]],
]
const cells = PATTERNS.flatMap(([ox, oy, pts]) =>
  pts.map(([x, y]) => {
    const cx = (ox + x) * CELL + CELL / 2
    const cy = (oy + y) * CELL + CELL / 2
    return `<circle cx="${cx}" cy="${cy}" r="9" fill="#3ee6a8" opacity="0.12"/><circle cx="${cx}" cy="${cy}" r="4.5" fill="#3ee6a8" opacity="0.55"/>`
  }),
).join('')

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1319"/><stop offset="1" stop-color="#090d12"/></linearGradient>
<pattern id="pips" width="${CELL}" height="${CELL}" patternUnits="userSpaceOnUse"><circle cx="${CELL / 2}" cy="${CELL / 2}" r="1" fill="#8aa0b2" opacity="0.18"/></pattern>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#pips)"/>
${cells}
</svg>`

// Message cards: solid enough to read over the board.
const card: ThemeMessageRule = { radius: 6, padding: 14, borderWidth: 1 }

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'life', glass: false },
}

const LOOK: ThemeSetArgs = {
  ...BASE,
  style: {
    Text: { fontFamily: ['sans'], fontSize: 15, lineHeight: 23 },
    Heading: { fontFamily: ['mono'], fontWeight: 'semibold', color: '#3ee6a8', letterSpacing: 0.5 },
    UserMessage: {
      ...card,
      color: '#e6f1ee',
      backgroundColor: '#11241e',
      borderColor: '#2b6b56',
    },
    AssistantMessage: {
      ...card,
      color: '#e6f1ee',
      backgroundColor: '#0f161c',
      paddingTop: 22,
      // A tiny glider in the top-left corner of every reply.
      fill: {
        vector: {
          viewBox: 48,
          slice: 16,
          paths: [
            { d: 'M0 0H48V48H0Z', color: '#0f161c' },
            { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: '#0f161c' },
            { d: 'M6 3h3v3h-3ZM9 6h3v3h-3ZM3 9h3v3h-3ZM6 9h3v3h-3ZM9 9h3v3h-3Z', color: '#3ee6a8' },
          ],
        },
      },
    },
    ToolUse: { color: '#b4c6c1', fontFamily: ['code'], backgroundColor: '#0f161cee', radius: 4, paddingX: 8 },
  },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    let set
    try {
      set = await $.theme.set(LOOK)
    } catch (error) {
      $.ui.log(String(error))
      set = await $.theme.set(BASE)
    }
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.scene !== 'life') {
      return next(e)
    }

    const { Shader, Svg } = $.ui.resolve(e)

    return (
      <Shader module="./life.ts">
        <Svg source={SCENE} alt="A Game of Life board of glowing mint cells on a dark grid" />
      </Shader>
    )
  })
}
