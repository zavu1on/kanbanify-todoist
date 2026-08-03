#!/usr/bin/env bash
# Stop hook: runs the project's SDLC gates (typecheck + tests) before the agent finishes.
# Blocks the stop and feeds the failure back to the model, so a red gate becomes work
# instead of something handed to the human.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 0

input=$(cat)

# Claude Code sets stop_hook_active when the model was already resumed by this hook.
# Without this guard a gate the model cannot fix would loop forever.
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

# Nothing to check if no source file changed this session (docs-only turns, questions, etc.).
if [ -z "$(git status --porcelain -- src 2>/dev/null)" ]; then
  exit 0
fi

if ! output=$(yarn typecheck 2>&1); then
  jq -n --arg r "$(printf 'yarn typecheck failed — fix it before finishing:\n\n%s' "$output")" \
    '{decision: "block", reason: $r}'
  exit 0
fi

if ! output=$(yarn test 2>&1); then
  jq -n --arg r "$(printf 'yarn test failed — fix it before finishing:\n\n%s' "$output")" \
    '{decision: "block", reason: $r}'
  exit 0
fi

exit 0
