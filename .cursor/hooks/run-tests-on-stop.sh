#!/bin/bash
# Hook: stop — Automatically run tests when the agent finishes.
# If tests fail, return a followup_message so the agent auto-retries.
#
# Input (stdin): { "status": "completed"|"aborted"|"error", "loop_count": 0 }
# Output (stdout): { "followup_message": "..." } or {}

set -euo pipefail

# Read hook input
INPUT=$(cat)
STATUS=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
LOOP_COUNT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('loop_count',0))" 2>/dev/null || echo "0")

# Only run tests on successful completion (not abort/error)
if [ "$STATUS" != "completed" ]; then
  echo '{}'
  exit 0
fi

# Safety: don't loop more than 2 times (initial run + 2 retries)
if [ "$LOOP_COUNT" -ge 2 ]; then
  echo '{}'
  exit 0
fi

# Run tests from the project root
cd "$(dirname "$0")/../.."
TEST_OUTPUT=$(npx vitest run 2>&1) || true
EXIT_CODE=${PIPESTATUS[0]:-$?}

# Check if tests passed
if echo "$TEST_OUTPUT" | grep -q "Tests.*failed"; then
  # Extract the failure summary
  FAIL_SUMMARY=$(echo "$TEST_OUTPUT" | tail -20 | sed 's/"/\\"/g' | tr '\n' ' ')

  # Return followup message so the agent auto-fixes
  python3 -c "
import json
msg = 'Tests failed after your last changes. Please fix the failing tests and run npm test again. Here is the output:\\n\\n' + '''$FAIL_SUMMARY'''
print(json.dumps({'followup_message': msg}))
"
else
  # Tests passed — no followup needed
  echo '{}'
fi

exit 0
