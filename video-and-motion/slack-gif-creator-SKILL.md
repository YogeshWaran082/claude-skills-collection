---
name: slack-gif-creator
description: Create custom, crisp, loopable animated GIFs sized and optimized for Slack emojis and reactions using Python/Pillow or Canvas/FFmpeg. Use when making custom Slack GIFs or animated stickers.
---

# Slack GIF Creator

Build snappy, lightweight, seamlessly looping animated GIFs tailored for Slack.

## Slack Specs & Constraints
- **Emoji GIF**: `128x128` px, under `128 KB` (aim for `< 100 KB`), transparent or high-contrast background.
- **Reaction / Inline GIF**: `480x480` or `480x270` px, under `2 MB`.
- **Frame Rate & Loop**: 12–20 FPS (`50–80ms` frame delay), seamless first-to-last frame loop (`loop=0`).

## Workflow
1. **Design the Motion**: Use easing curves (ease-in-out, bounce, squash-and-stretch) rather than linear motion.
2. **Optimize Palette**: Quantize to 64–128 colors with `disposal=2` to prevent ghosting/trails and keep file size tiny.
3. **Verify**: Check final dimensions, file size, and loop smoothness before delivery.
