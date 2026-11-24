// STEP 1 of finding what the Windows app rejects: a stored board and the cursor,
// with no Life rules and no randomness. The cursor paints cells that fade out.
import {
  buffer,
  clamp,
  dt,
  floor,
  fract,
  length,
  max,
  mix,
  picture,
  pointers,
  shader,
  sin,
  smoothstep,
  time,
  vec3,
  vec4,
  type Buffer,
} from 'claude-code/shader'

// Points per cell.
const S = 14

// One texel per cell, default 8-bit lanes: x brightness.
const board: Buffer = buffer({ scale: 1 / S, filter: 'nearest' }, p => {
  let lit = max(board.at(p.cell).x - dt * 0.4, 0)

  for (const ptr of pointers) {
    if (length(p.point - ptr.at) < S * 1.2) {
      lit = 1
    }
  }

  return vec4(lit, 0, 0, 1)
})

const view = picture(p => {
  const g = p.point / S
  const lit = board.at(floor(g)).x
  const d = length(fract(g) - 0.5)

  // Ground: a slow drift between deep blue and deep purple, about 20 s a cycle.
  const t = 0.5 + 0.5 * sin(time * 0.3)
  const bg = mix(vec3(0.05, 0.08, 0.22), vec3(0.2, 0.05, 0.25), t) * (0.8 + 0.2 * p.uv.y)

  // A faint dot at every cell, and mint where the cursor has been.
  const pip = (1 - smoothstep(0.04, 0.09, d)) * 0.07
  const core = 1 - smoothstep(0.26, 0.34, d)
  const halo = (1 - smoothstep(0.1, 0.75, d)) * 0.3
  const a = clamp(lit * (core * 0.5 + halo), 0, 1)

  return vec4(bg + vec3(0.5, 0.6, 0.7) * pip + vec3(0.24, 0.9, 0.66) * a, 1)
})

export default shader({ fps: 30, passes: [board, view] })
