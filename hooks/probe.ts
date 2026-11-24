// TEMPORARY diagnostic: the simplest possible shader. If this plays, the app runs
// theme shaders and the problem is inside life.ts; if not, the app isn't playing any.
import { mix, picture, shader, sin, time, vec3, vec4 } from 'claude-code/shader'

const view = picture(p => {
  // A slow drift between deep blue and deep purple, one cycle every ~20 seconds.
  const t = 0.5 + 0.5 * sin(time * 0.3)
  const rgb = mix(vec3(0.05, 0.08, 0.22), vec3(0.2, 0.05, 0.25), t) * (0.8 + 0.2 * p.uv.y)
  return vec4(rgb, 1)
})

export default shader({ fps: 30, passes: [view] })
