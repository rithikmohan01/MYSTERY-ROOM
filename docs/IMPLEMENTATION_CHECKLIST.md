# Specification checklist

This checklist tracks the first implementation against `spec.md`; ✅ means implemented in this starter, ◐ means a playable or partial implementation, and ☐ means still outstanding.

| Requirement IDs | State | Notes |
|---|---|---|
| FR-001–006 | ✅ | Responsive landing page, archive, fictional-content notice |
| FR-007–016 | ✅ | Validated form, difficulty, 3–6 suspects, evidence preferences, loading/retry, unique Mongo ID |
| FR-017–021 | ✅ | Briefing and suspect profiles, explicit DTO omits solution |
| FR-022–030 | ✅ | Evidence categories, viewers, review state, notes, flags, typed content, safe DTO whitelist |
| FR-031–036 | ✅ | Fictional chronological message-thread rendering |
| FR-037–042 | ◐ | Image metadata and labeled fallback; no image-generation provider/storage adapter |
| FR-043–048 | ◐ | CCTV simulation transcript; no generated frames or playback controls |
| FR-049–053 | ✅ | Private session notes, flags and persistent progress |
| FR-054–062 | ✅ | Confirmed single accusation, server result, explicit reveal/abandon |
| FR-063–068 | ✅ | Mongo persistence and signed guest cookie ownership |
| NFR-001–012 | ◐ | Main security, consistency, limits, and responsive UI are implemented; observability, accessibility audit, and test harness remain |
| Phase 1–6 | ◐ | End-to-end app scaffold implemented; production MongoDB and credentials not available in this workspace |
| Unit/integration/frontend tests | ☐ | Test plan documented; automated suites not yet added |
