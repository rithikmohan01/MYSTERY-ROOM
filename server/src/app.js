import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { Investigation } from "./model.js";
import { generateMystery } from "./generate.js";

const app = express();
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOrigin = (value) => {
  if (!value || value === origin) return true;
  if (process.env.NODE_ENV === "production") return false;
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
};
app.use(helmet());
app.use(
  cors({
    origin: (value, callback) => callback(null, allowedOrigin(value)),
    credentials: true,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
const secret = () =>
  process.env.SESSION_SECRET || "development-only-change-this-secret";
const sign = (value) =>
  createHmac("sha256", secret()).update(value).digest("hex");
app.use((req, res, next) => {
  const token = req.cookies?.mystery_session;
  if (token) {
    const split = token.lastIndexOf(".");
    const id = token.slice(0, split),
      sig = token.slice(split + 1);
    const expected = sign(id);
    if (
      split > 0 &&
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      req.ownerId = id;
  }
  if (!req.ownerId && req.path !== "/api/v1/health") {
    const requestOrigin = req.get("origin");
    if (req.method !== "GET" && !allowedOrigin(requestOrigin))
      return res
        .status(403)
        .json(fail("ORIGIN_REJECTED", "Request origin is not allowed."));
    req.ownerId = randomBytes(24).toString("hex");
    res.cookie("mystery_session", `${req.ownerId}.${sign(req.ownerId)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  next();
});
app.get("/api/v1/health", (_req, res) => res.json(ok({ status: "ok" })));
app.post(
  "/api/v1/mysteries",
  rateLimit({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          scenario: z.string().trim().min(20).max(3000),
          difficulty: z.enum(["easy", "medium", "hard"]),
          suspectCount: z.number().int().min(3).max(6),
          evidencePreferences: z
            .array(z.enum(["message", "image", "cctv", "witness_statement"]))
            .min(1)
            .max(4),
        })
        .strict()
        .parse(req.body);
      const generated = await generateMystery(input);
      const doc = await Investigation.create({
        ...generated,
        difficulty: input.difficulty,
        ownerId: req.ownerId,
        status: "active",
        progress: { reviewedEvidenceIds: [], notes: "", flaggedSuspectIds: [] },
      });
      res.status(201).json(ok(publicCase(doc)));
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/v1/mysteries", async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const items = await Investigation.find({ ownerId: req.ownerId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(ok({ items: items.map(summary), nextCursor: null }));
  } catch (e) {
    next(e);
  }
});
app.get("/api/v1/mysteries/:id", async (req, res, next) => {
  try {
    const d = await owned(req, res);
    if (d) res.json(ok(publicCase(d)));
  } catch (e) {
    next(e);
  }
});
app.get("/api/v1/mysteries/:id/evidence", async (req, res, next) => {
  try {
    const d = await owned(req, res);
    if (!d) return;
    const type = req.query.type;
    res.json(ok(d.evidence.filter((e) => !type || e.type === type)));
  } catch (e) {
    next(e);
  }
});
app.get(
  "/api/v1/mysteries/:id/evidence/:evidenceId",
  async (req, res, next) => {
    try {
      const d = await owned(req, res);
      if (!d) return;
      const e = d.evidence.find((x) => x.id === req.params.evidenceId);
      if (!e)
        return res
          .status(404)
          .json(fail("NOT_FOUND", "Evidence was not found."));
      res.json(ok(e));
    } catch (e) {
      next(e);
    }
  },
);
app.patch("/api/v1/mysteries/:id/progress", async (req, res, next) => {
  try {
    const d = await owned(req, res);
    if (!d) return;
    if (d.status !== "active")
      return res
        .status(409)
        .json(fail("CASE_CLOSED", "This investigation is closed."));
    const p = z
      .object({
        reviewedEvidenceIds: z.array(z.string()).optional(),
        notes: z.string().max(5000).optional(),
        flaggedSuspectIds: z.array(z.string()).optional(),
      })
      .strict()
      .parse(req.body);
    if (
      p.reviewedEvidenceIds &&
      p.reviewedEvidenceIds.some((id) => !d.evidence.some((e) => e.id === id))
    )
      return res
        .status(400)
        .json(fail("INVALID_PROGRESS", "Unknown evidence ID."));
    if (
      p.flaggedSuspectIds &&
      p.flaggedSuspectIds.some((id) => !d.suspects.some((s) => s.id === id))
    )
      return res
        .status(400)
        .json(fail("INVALID_PROGRESS", "Unknown suspect ID."));
    d.progress ||= {
      reviewedEvidenceIds: [],
      notes: "",
      flaggedSuspectIds: [],
    };
    Object.assign(d.progress, p);
    await d.save();
    res.json(ok(progressDto(d.progress)));
  } catch (e) {
    next(e);
  }
});
app.post("/api/v1/mysteries/:id/accusation", async (req, res, next) => {
  try {
    const d = await owned(req, res);
    if (!d) return;
    const { suspectId } = z
      .object({ suspectId: z.string() })
      .strict()
      .parse(req.body);
    if (d.status !== "active")
      return res
        .status(409)
        .json(fail("CASE_CLOSED", "An accusation has already been submitted."));
    if (!d.suspects.some((s) => s.id === suspectId))
      return res
        .status(400)
        .json(fail("INVALID_SUSPECT", "Choose a suspect in this case."));
    const closed = await Investigation.findOneAndUpdate(
      {
        _id: d._id,
        ownerId: req.ownerId,
        status: "active",
        "accusation.submittedAt": null,
      },
      {
        $set: {
          status: "completed",
          accusation: {
            suspectId,
            isCorrect: d.solution.culpritId === suspectId,
            submittedAt: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!closed)
      return res
        .status(409)
        .json(fail("CASE_CLOSED", "An accusation has already been submitted."));
    res.json(ok(resultDto(closed)));
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/v1/mysteries/:id/reveal-solution",
  rateLimit({ windowMs: 60_000, limit: 5 }),
  async (req, res, next) => {
    try {
      const d = await owned(req, res);
      if (!d) return;
      if (d.status !== "active")
        return res
          .status(409)
          .json(fail("CASE_CLOSED", "This investigation is already closed."));
      const closed = await Investigation.findOneAndUpdate(
        { _id: d._id, ownerId: req.ownerId, status: "active" },
        {
          $set: {
            status: "abandoned",
            accusation: { submittedAt: new Date() },
          },
        },
        { new: true },
      );
      if (!closed)
        return res
          .status(409)
          .json(fail("CASE_CLOSED", "This investigation is already closed."));
      res.json(ok({ solution: closed.solution }));
    } catch (e) {
      next(e);
    }
  },
);
async function owned(req, res) {
  const d = await Investigation.findOne({
    _id: req.params.id,
    ownerId: req.ownerId,
  });
  if (!d) {
    res.status(404).json(fail("NOT_FOUND", "Investigation was not found."));
    return null;
  }
  return d;
}
function progressDto(p = {}) {
  return {
    reviewedEvidenceIds: Array.isArray(p.reviewedEvidenceIds)
      ? p.reviewedEvidenceIds
      : [],
    notes: typeof p.notes === "string" ? p.notes : "",
    flaggedSuspectIds: Array.isArray(p.flaggedSuspectIds)
      ? p.flaggedSuspectIds
      : [],
  };
}
function publicCase(d) {
  const completed = ["completed", "abandoned"].includes(d.status);
  return {
    id: String(d._id),
    title: d.title,
    difficulty: d.difficulty || "medium",
    status: d.status || "active",
    createdAt: d.createdAt,
    case: d.case,
    suspects: d.suspects,
    evidence: d.evidence,
    timeline: d.timeline,
    progress: progressDto(d.progress),
    ...(completed ? { solution: d.solution, accusation: d.accusation } : {}),
  };
}
function summary(d) {
  return {
    id: String(d._id),
    title: d.title,
    difficulty: d.difficulty || "medium",
    status: d.status || "active",
    createdAt: d.createdAt,
    suspectCount: d.suspects.length,
  };
}
function resultDto(d) {
  return {
    isCorrect: d.accusation.isCorrect,
    selectedSuspect: d.suspects.find((s) => s.id === d.accusation.suspectId),
    correctSuspect: d.solution.culprit,
    solution: d.solution,
  };
}
const ok = (data) => ({ success: true, data, error: null });
const fail = (code, message) => ({
  success: false,
  data: null,
  error: { code, message },
});
app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError)
    return res
      .status(400)
      .json(
        fail("VALIDATION_ERROR", err.issues.map((x) => x.message).join(" ")),
      );
  console.error(
    "API error:",
    err.code || err.name || "ERROR",
    err.status || err.statusCode || "",
    err.message || "",
  );
  const status = err.status || err.statusCode || 500;
  const message = ["INVALID_GENERATED_CASE", "GENERATION_BUSY"].includes(
    err.code,
  )
    ? err.message
    : status < 500
      ? err.message
      : "The server could not complete the request.";
  res.status(status).json(fail(err.code || "INTERNAL_ERROR", message));
});
export default app;
