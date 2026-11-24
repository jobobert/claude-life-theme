// STEP 2 of finding what the Windows app rejects: step 1 (stored board + cursor)
// plus the Life rules. No randomness: the board starts empty and the cursor seeds it.
import {
  abs,
  buffer,
  clamp,
  dt,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  picture,
  pointers,
  shader,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
  vec4,
  type Buffer,
} from 'claude-code/shader'

// Points per cell, and seconds per generation (slow, so nothing flashes).
const S = 14
const STEP = 0.9

// One texel per cell, default 8-bit lanes:
// x alive, y cyan glow from the cursor, z eased brightness.
const life: Buffer = buffer({ scale: 1 / S, filter: 'nearest' }, p => {
  const c = p.cell
  const self = life.at(c)
  let alive = self.x
  let glow = max(self.y - dt * 0.5, 0)

  // Once every STEP seconds: the frame whose time crosses a multiple of STEP.
  const tick = fract(time / STEP) < dt / STEP

  if (tick) {
    const n =
      life.at(c + vec2(-1, -1)).x + life.at(c + vec2(0, -1)).x + life.at(c + vec2(1, -1)).x +
      life.at(c + vec2(-1, 0)).x + life.at(c + vec2(1, 0)).x +
      life.at(c + vec2(-1, 1)).x + life.at(c + vec2(0, 1)).x + life.at(c + vec2(1, 1)).x
    const born = abs(n - 3) < 0.5
    const stays = alive > 0.5 && abs(n - 2) < 0.5
    alive = born || stays ? 1 : 0
  }

  // The cursor plants cells as it moves; a click plants a blob.
  for (const ptr of pointers) {
    const d = length(p.point - ptr.at)
    const moved = length(ptr.at - ptr.was) > 0.5
    if (ptr.gone < 0.001 && moved && d < S * 1.2) {
      alive = 1
      glow = 1
    }
    if (ptr.down > 0.5 && ptr.age < 0.001 && d < S * 2.5) {
      alive = 1
      glow = 1
    }
  }

  // Fade linearly over about half a second.
  const bright = alive > 0.5 ? min(self.z + dt * 2.2, 1) : max(self.z - dt * 2.2, 0)
  return vec4(alive, glow, bright, 1)
})

const view = picture(p => {
  const g = p.point / S
  const st = life.at(floor(g))
  const d = length(fract(g) - 0.5)

  // Ground: a slow drift between deep blue and deep purple, about 20 s a cycle.
  const t = 0.5 + 0.5 * sin(time * 0.3)
  const bg = mix(vec3(0.05, 0.08, 0.22), vec3(0.2, 0.05, 0.25), t) * (0.8 + 0.2 * p.uv.y)

  // A faint dot at every cell.
  const pip = (1 - smoothstep(0.04, 0.09, d)) * 0.07

  // Living cells: mint, cyan where the cursor just planted them, dimmer mid-screen where the words sit.
  const core = 1 - smoothstep(0.26, 0.34, d)
  const halo = (1 - smoothstep(0.1, 0.75, d)) * 0.3
  const mid = 1 - 0.5 * (1 - smoothstep(0.15, 0.4, abs(p.uv.x - 0.5)))
  const a = clamp(st.z * (core * 0.5 + halo) * mid, 0, 1)
  const col = mix(vec3(0.24, 0.9, 0.66), vec3(0.45, 0.85, 1.0), st.y)

  return vec4(bg + vec3(0.5, 0.6, 0.7) * pip + col * a, 1)
})

export default shader({ fps: 30, passes: [life, view] })
