import {
  abs,
  buffer,
  clamp,
  dot,
  dt,
  exp,
  first,
  floor,
  fract,
  fresh,
  length,
  mix,
  picture,
  pointers,
  shader,
  sin,
  smoothstep,
  still,
  time,
  vec2,
  vec3,
  vec4,
  type Buffer,
} from 'claude-code/shader'

// Points per cell, and seconds per generation (slow, so nothing flashes).
const S = 14
const STEP = 0.7

const hash = (c: vec2, k: number) => fract(sin(dot(c, vec2(127.1, 311.7)) + k * 74.7) * 43758.5453)

// One texel per cell: x alive, y "fresh from the cursor" glow, z eased brightness.
const life: Buffer = buffer({ scale: 1 / S, filter: 'nearest', float: 16 }, p => {
  const c = p.cell

  if (first || fresh) {
    const seed = hash(c, 1) > 0.8 ? 1 : 0
    return vec4(seed, 0, seed, 1)
  }

  const self = life.at(c)
  let alive = self.x
  let glow = self.y * exp(-dt * 0.6)

  const gen = floor(time / STEP)
  const tick = gen - floor((time - dt) / STEP) > 0.5

  if (tick && still < 0.5) {
    let n = 0
    for (const [ox, oy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const) {
      n += life.at(c + vec2(ox, oy)).x
    }
    const born = abs(n - 3) < 0.5
    const stays = alive > 0.5 && abs(n - 2) < 0.5
    alive = born || stays ? 1 : 0
    // A rare spark so the board never goes quiet.
    if (hash(c, gen) > 0.9985) {
      alive = 1
    }
  }

  // The cursor plants cells as it moves; a click plants a burst.
  for (const ptr of pointers) {
    const d = length(p.point - ptr.at)
    const moved = length(ptr.at - ptr.was) > 0.5
    if (ptr.gone < 0.001 && moved && d < S * 1.6 && hash(c, time) > 0.5) {
      alive = 1
      glow = 1
    }
    if (ptr.down > 0.5 && ptr.age < 0.001 && d < S * 4 && hash(c, time + 3) > 0.55) {
      alive = 1
      glow = 1
    }
  }

  const bright = mix(self.z, alive, 1 - exp(-dt * 4))
  return vec4(alive, glow, bright, 1)
})

const view = picture(p => {
  const g = p.point / S
  const st = life.at(floor(g))
  const d = length(fract(g) - 0.5)

  // Board: deep blue-black, a faint dot at every cell.
  const bg = mix(vec3(0.035, 0.05, 0.07), vec3(0.05, 0.075, 0.1), p.uv.y)
  const pip = (1 - smoothstep(0.04, 0.09, d)) * 0.07

  // Living cells: mint, cyan where the cursor just planted them, dimmer mid-screen where the words sit.
  const core = 1 - smoothstep(0.26, 0.34, d)
  const halo = (1 - smoothstep(0.1, 0.75, d)) * 0.35
  const mid = 1 - 0.5 * (1 - smoothstep(0.15, 0.4, abs(p.uv.x - 0.5)))
  const a = clamp(st.z * (core * 0.6 + halo) * mid, 0, 1)
  const col = mix(vec3(0.24, 0.9, 0.66), vec3(0.45, 0.85, 1.0), st.y)

  const rgb = bg + vec3(0.5, 0.6, 0.7) * pip + col * a
  return vec4(rgb, 1)
})

export default shader({ fps: 30, passes: [life, view] })
