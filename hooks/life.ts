import {
  abs,
  buffer,
  clamp,
  dt,
  floor,
  fract,
  frame,
  length,
  max,
  min,
  mix,
  mod,
  picture,
  pointers,
  shader,
  sign,
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
const EVERY = STEP * 30 // frames per generation at 30 fps

// Float hash with small arguments: the same on every GPU (no sin(), no ints).
const hash = (c: vec2, k: number) => {
  const qx = fract((c.x + k * 0.37) * 0.1031)
  const qy = fract((c.y - k * 0.71) * 0.1031)
  const qz = fract((c.x + k * 0.13) * 0.1031)
  const d = qx * (qy + 33.33) + qy * (qz + 33.33) + qz * (qx + 33.33)
  return fract((qx + qy + 2 * d) * (qz + d))
}

// One texel per cell, default 8-bit lanes (0 to 1):
// x alive, y cyan glow from the cursor, z eased brightness, w 1 once set up.
const life: Buffer = buffer({ scale: 1 / S, filter: 'nearest' }, p => {
  const c = p.cell
  const self = life.at(c)

  // Buffers start cleared, so w = 0 means this cell was never set up: seed it once.
  if (self.w < 0.5) {
    const seed = hash(c, 1) > 0.85 ? 1 : 0
    return vec4(seed, 0, seed, 1)
  }

  let alive = self.x
  let glow = max(self.y - dt * 0.5, 0)

  const gen = floor(frame / EVERY)
  const tick = abs(mod(frame, EVERY)) < 0.5

  if (tick) {
    let n = 0
    for (const [ox, oy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const) {
      n += life.at(c + vec2(ox, oy)).x
    }
    const born = abs(n - 3) < 0.5
    const stays = alive > 0.5 && abs(n - 2) < 0.5
    alive = born || stays ? 1 : 0
    // A rare spark so the board never goes quiet.
    if (hash(c, mod(gen, 500) + 3) > 0.998) {
      alive = 1
    }
  }

  // The cursor plants cells as it moves; a click plants a burst.
  const k = mod(frame, 499) + 11
  for (const ptr of pointers) {
    const d = length(p.point - ptr.at)
    const moved = length(ptr.at - ptr.was) > 0.5
    if (ptr.gone < 0.001 && moved && d < S * 1.6 && hash(c, k) > 0.5) {
      alive = 1
      glow = 1
    }
    if (ptr.down > 0.5 && ptr.age < 0.001 && d < S * 4 && hash(c, k + 5) > 0.55) {
      alive = 1
      glow = 1
    }
  }

  // Fade linearly over about half a second (exact in 8 bits, no ghosts left behind).
  const diff = alive - self.z
  const bright = self.z + sign(diff) * min(abs(diff), dt * 2.2)
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

  const rgb = bg + vec3(0.5, 0.6, 0.7) * pip + col * a
  return vec4(rgb, 1)
})

export default shader({ fps: 30, passes: [life, view] })
