#!/usr/bin/env bash
# Guard against source files growing without bound (see Sprint 14/17 splits).
# Fails if any non-test TS/TSX file exceeds MAX_LINES. Run in CI and via
# `npm run check:sizes`. Raise the limit deliberately, don't just bump it.
set -euo pipefail
MAX_LINES="${MAX_LINES:-1200}"
cd "$(dirname "$0")/.."
fail=0
while IFS= read -r f; do
  n=$(wc -l < "$f")
  if [ "$n" -gt "$MAX_LINES" ]; then
    echo "TOO LARGE: $f ($n lines > $MAX_LINES)"; fail=1
  fi
done < <(find backend/src frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx')
if [ "$fail" -eq 0 ]; then echo "OK: all source files <= $MAX_LINES lines"; fi
exit $fail
