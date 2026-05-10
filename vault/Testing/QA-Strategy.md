---
type: note
status: active
tags:
  - testing
  - qa
---

# QA Strategy

## Validation ladder
1. Check the smallest relevant behavior first.
2. Run the narrowest automated check that can fail the hypothesis.
3. Expand to lint, typecheck, regression tests, or build only when needed.
4. Record what was verified and what remains unverified.

## Reference commands
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:regressions`
- `npm run check`
