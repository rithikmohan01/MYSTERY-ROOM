# Verification plan

Use a test MongoDB database and mock the Gemini adapter for repeatable checks.

- Unit: request validation, generated-case integrity, unique IDs, references, chronology, public DTO secrecy, accusation evaluation.
- API integration: create, malformed AI output, retrieval ownership, progress persistence, valid/invalid and duplicate accusations, pre/post reveal access, Mongo failure.
- UI: responsive navigation, form validation, evidence viewers, progress reload, notes, accusation confirmation and result explanation.
- Acceptance: create a case, inspect multiple evidence items, save a note, reload, accuse once, confirm solution, and verify repeat accusation is rejected.

Run the test suite after adding test files and a Mongo/Gemini mock harness. Live Gemini calls are optional and should not be required for automated checks.
