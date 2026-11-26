---
name: ai-video-prompt-director
description: Plan and write prompts, shot lists and storyboards for AI video tools such as Google Flow (Veo), Runway, Kling and Luma. Use when the user wants to make an AI-generated video, ad, short film, reel or product clip, wants consistent characters across shots, or asks for Veo/Flow/Runway/Kling prompts. Output is prompts and a shot plan for the user to run in the tool; this skill does not generate video itself.
---

# AI Video Prompt Director

Turn an idea into a shot plan plus ready-to-paste prompts. Claude writes the prompts; the user generates in the AI video tool.

## Workflow
1. **Brief (ask only what is missing):** goal/platform, length, aspect ratio (16:9 or 9:16), style/mood, tool (Flow/Veo, Runway, Kling, Luma), whether audio/dialogue is wanted, any reference images.
2. **Lock the look bible** once, and paste it into every prompt: character descriptions (age, hair, clothes, one distinctive prop), setting, time of day, color palette, lens/film look, mood.
3. **Break into shots** of 4-8 seconds. One action per shot. 3-8 shots for a 30s piece.
4. **Write one prompt per shot** using the formula below.
5. **Give the assembly plan:** order, transitions, music/VO, and final edit notes.

## Prompt formula (one paragraph per shot)
`[Shot type + camera movement] of [subject with look-bible details] [single clear action], in [setting + time + lighting]. [Style/film look]. [Audio: ambience, SFX, music mood, or dialogue line].`

Example:
> Slow dolly-in, medium close-up of a woman in her 30s with a short black bob and a mustard raincoat, lifting a steaming cup and smiling at the window, in a small rainy-day cafe at dusk with warm tungsten light. Soft cinematic 35mm look, shallow depth of field, teal and amber palette. Audio: rain on glass, quiet cafe murmur, gentle piano.

## Rules
- One subject action per shot; avoid chains of events.
- Camera: name the shot size (wide/medium/close-up/macro), angle (eye-level/low/high/overhead), and movement (static, pan, tilt, dolly, tracking, handheld, orbit, crane).
- Be concrete: specific colors, materials, lighting direction; no vague words like "beautiful".
- Reuse the exact look-bible wording in every shot for consistency.
- Dialogue: keep to one short line per shot; state who says it and the tone.
- Say what to avoid in a final line when the tool supports negatives (e.g. "no text, no watermark, no extra fingers").
- Text on screen: generate without text and add titles in editing.

## Mapping to Google Flow features
- **Ingredients to Video:** supply reference images (character, object, style). List which ingredients to upload per shot.
- **Frames to Video:** give a start frame and end frame; write the prompt for the transition between them.
- **Extend:** continue a clip from its final moments; write the next action only.
- **Insert / remove objects:** after generating, describe the element to add or remove and where.
- **Camera controls:** state the camera move in the prompt and set it in the tool.
Check the tool for the current feature list, since it changes often.

## Output format
```
LOOK BIBLE: ...
SHOT 1 (6s, 16:9): <prompt>
  Ingredients/frames: ...
  Audio/VO: ...
SHOT 2 ...
ASSEMBLY: order, transitions, music, VO script, caption plan, export settings
```

## Checklist
- [ ] Look bible repeated in every shot
- [ ] One action per shot, 4-8s each
- [ ] Camera, lighting and audio specified
- [ ] Aspect ratio matches the platform
- [ ] Assembly and edit plan included
