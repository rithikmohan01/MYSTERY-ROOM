# Data model

`Investigation` is the source of truth. It stores case facts, suspects, evidence, sorted timeline, session ownership, player progress, private solution, accusation and timestamps. Subdocuments use stable IDs within a case; MongoDB generates the investigation ObjectId. An index supports newest-first owner history.

The solution and internal clue metadata are stored on the private Mongoose document and excluded from public DTOs until status is `completed` or `abandoned`. Accusation uses a conditional `findOneAndUpdate` on active status and a null submission timestamp to prevent duplicate submissions. Progress updates accept only reviewed evidence IDs, notes and flagged suspect IDs and validate all references.
