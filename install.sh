#!/usr/bin/env bash
set -euo pipefail

# Install all (or one category) of *-SKILL.md files into a target agent's skills directory.
# Usage:
#   ./install.sh [claude|claude-local|gemini|codex|cursor] [category-folder]
# Examples:
#   ./install.sh claude
#   ./install.sh claude-local designing
#   ./install.sh gemini

TARGET="${1:-claude}"
CATEGORY="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$TARGET" in
  claude)
    DEST="$HOME/.claude/skills"
    MODE="skill_dir"
    ;;
  claude-local)
    DEST="$PWD/.claude/skills"
    MODE="skill_dir"
    ;;
  gemini)
    DEST="$HOME/.gemini/antigravity/skills"
    MODE="skill_dir"
    ;;
  codex)
    DEST="$HOME/.codex/skills"
    MODE="skill_dir"
    ;;
  cursor)
    DEST="$PWD/.cursor/rules"
    MODE="cursor_mdc"
    ;;
  *)
    echo "Usage: $0 [claude|claude-local|gemini|codex|cursor] [category-folder]"
    exit 1
    ;;
esac

SEARCH_ROOT="$SCRIPT_DIR"
if [[ -n "$CATEGORY" ]]; then
  if [[ ! -d "$SCRIPT_DIR/$CATEGORY" ]]; then
    echo "Category folder not found: $CATEGORY"
    exit 1
  fi
  SEARCH_ROOT="$SCRIPT_DIR/$CATEGORY"
fi

mkdir -p "$DEST"
COUNT=0

while IFS= read -r -d '' file; do
  base="$(basename "$file" -SKILL.md)"
  if [[ "$MODE" == "skill_dir" ]]; then
    mkdir -p "$DEST/$base"
    cp "$file" "$DEST/$base/SKILL.md"
  else
    cp "$file" "$DEST/$base.mdc"
  fi
  COUNT=$((COUNT + 1))
done < <(find "$SEARCH_ROOT" -type f -name "*-SKILL.md" -print0)

echo "Installed $COUNT skills into $DEST ($TARGET)."
