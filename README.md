# Life — a Game of Life theme for Claude

A dark theme for the Claude desktop and mobile apps. Behind the conversation, over a ground that slowly drifts between deep blue and deep purple, a board of mint cells lives and dies by Conway's Game of Life, one gentle generation every 0.9 seconds. The board starts empty: move your cursor to plant a trail of cells, or click to plant a blob, and watch them break up into blinkers, blocks and gliders. Freshly planted cells glow cyan, then cool to mint as the rules take over.

- Deep blue-black surfaces with a mint accent (dark mode only)
- Live, GPU-drawn board on desktop; a still board on mobile and under Reduce Motion
- Message cards styled to read clearly over the board, with a tiny glider in the corner of each reply
- Cells fade in and out softly and dim toward the middle, so nothing flashes or fights the text

The terminal and editor extensions don't draw themes.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install life-theme --marketplace jobobert/claude-life-theme
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```bash
claude plugin install life-theme --marketplace jobobert/claude-life-theme
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `jobobert/claude-life-theme`, then **Add plugin**.

## Tweaking

- `hooks/life.ts` — the shader: cell size (`S`), generation speed (`STEP`), the ground and cell colors, and what the cursor plants
- `hooks/register.tsx` — the color palette, the still fallback scene, and message styling
