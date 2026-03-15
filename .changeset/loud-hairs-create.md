---
'@honestjs/class-validator-pipe': minor
---

- Add options object API: `new ClassValidatorPipe({ validator?, transform? })`
- Preserve original error message in catch block instead of generic "Validation failed"
- Handle empty validation messages with fallback
- Add comprehensive unit tests
- Expand README with options, recipes, and troubleshooting
