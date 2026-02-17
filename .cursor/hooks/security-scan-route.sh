#!/bin/bash
# Hook: afterFileEdit — Security scan for route files.
# Checks for common vulnerabilities when API routes are modified.
#
# Input (stdin): { "file_path": "...", "edits": [...] }
# Output: none (afterFileEdit is fire-and-forget; findings logged to stderr)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")

# Only check route files
if [[ "$FILE_PATH" != *"/api/routes/"* ]]; then
  exit 0
fi

# Skip if file doesn't exist (deleted)
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

FINDINGS=""

# Check 1: User input in Content-Disposition without sanitization
if grep -q "Content-Disposition" "$FILE_PATH"; then
  if ! grep -q "replace\|safeName\|sanitize\|encodeURI" "$FILE_PATH"; then
    FINDINGS="${FINDINGS}\n⚠️  SECURITY: Content-Disposition header found without visible sanitization. User-supplied values in filenames can enable path traversal."
  fi
fi

# Check 2: Template literals in headers using request body fields directly
if grep -qE 'setHeader.*\$\{.*req\.(body|params|query)' "$FILE_PATH"; then
  FINDINGS="${FINDINGS}\n⚠️  SECURITY: User input from request body/params used directly in HTTP headers. Sanitize first."
fi

# Check 3: No try/catch around async route handler
if grep -q "async.*req.*res" "$FILE_PATH"; then
  if ! grep -q "try" "$FILE_PATH"; then
    FINDINGS="${FINDINGS}\n⚠️  QUALITY: Async route handler without try/catch. Unhandled rejections will crash the server."
  fi
fi

# Check 4: Raw error objects in response (stack trace leakage)
if grep -qE 'res\.(json|send)\(.*err\b' "$FILE_PATH"; then
  if grep -qE 'res\.(json|send)\(.*err[^.]' "$FILE_PATH"; then
    FINDINGS="${FINDINGS}\n⚠️  SECURITY: Raw error object may be sent in response. Use structured error codes, not stack traces."
  fi
fi

# Check 5: Missing Zod or validation on request body
if grep -q "req.body" "$FILE_PATH"; then
  if ! grep -qE "safeParse\|parse\|validate\|schema" "$FILE_PATH"; then
    FINDINGS="${FINDINGS}\n⚠️  SECURITY: req.body accessed without visible Zod/schema validation. All input must be validated."
  fi
fi

if [ -n "$FINDINGS" ]; then
  echo -e "🔒 Security scan for $(basename "$FILE_PATH"):${FINDINGS}" >&2
fi

exit 0
