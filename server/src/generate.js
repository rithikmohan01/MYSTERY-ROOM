import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const generatedSchema = z.object({
  title: z.string().min(3),
  case: z.object({
    incidentDescription: z.string(),
    incidentLocation: z.string(),
    incidentTime: z.string(),
    initialBriefing: z.string(),
  }),
  suspects: z
    .array(
      z.object({
        name: z.string(),
        age: z.preprocess(
          (v) => (v == null || v === "" ? undefined : v),
          z.coerce.number().int().positive().optional(),
        ),
        role: z.string(),
        relationship: z.string(),
        publicDescription: z.string(),
        motive: z.string(),
        alibi: z.string(),
        alibiConfidence: z.string().default("unverified"),
      }),
    )
    .min(3)
    .max(6),
  culpritIndex: z.coerce.number().int(),
  solution: z.object({
    motive: z.string(),
    method: z.string(),
    opportunity: z.string(),
    explanation: z.string(),
  }),
  evidence: z
    .array(
      z.object({
        type: z.enum([
          "message",
          "image",
          "cctv",
          "witness_statement",
          "document",
        ]),
        title: z.string(),
        description: z.string(),
        timestamp: z.string(),
        source: z.string().default("Case file"),
        relevance: z.string().default(""),
        content: z.record(z.any()),
      }),
    )
    .min(3),
  timeline: z
    .array(z.object({ description: z.string(), timestamp: z.string() }))
    .min(3),
});
const id = () => randomUUID();
export async function generateMystery(input) {
  if (!process.env.GEMINI_API_KEY)
    throw Object.assign(
      new Error(
        "Mystery generation is not configured. Add a Gemini API key to the server environment.",
      ),
      { status: 503, code: "GENERATION_UNAVAILABLE" },
    );
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const model =
    !configuredModel || configuredModel === "gemini-2.0-flash"
      ? "gemini-3.8-flash"
      : configuredModel;
  const modelCandidates =
    model === "gemini-3.8-flash"
      ? [
          model,
          "gemini-3.7-flash",
          "gemini-3.6-flash",
          "gemini-3.5-flash-lite",
          "gemini-2.5-flash",
        ]
      : [model];
  let activeModelIndex = 0;
  async function generateContent(contents) {
    for (
      let index = activeModelIndex;
      index < modelCandidates.length;
      index++
    ) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidates[index],
            contents,
            config: { responseMimeType: "application/json" },
          });
          activeModelIndex = index;
          return response;
        } catch (error) {
          const isTemporaryUnavailable =
            Number(error.status || error.statusCode) === 503 ||
            error.message?.includes("UNAVAILABLE");
          if (!isTemporaryUnavailable) throw error;
          if (attempt === 0) {
            console.warn(
              `Gemini model ${modelCandidates[index]} is temporarily unavailable; retrying once.`,
            );
            await new Promise((resolve) => setTimeout(resolve, 1200));
          } else {
            console.warn(
              `Gemini model ${modelCandidates[index]} is unavailable; ${modelCandidates[index + 1] ? `trying ${modelCandidates[index + 1]}` : "no fallback model remains"}.`,
            );
            activeModelIndex = index + 1;
          }
        }
      }
    }
    throw Object.assign(
      new Error("Gemini is temporarily busy. Please try again shortly."),
      { status: 503, code: "GENERATION_BUSY" },
    );
  }
  const prompt = `Create a playable, internally consistent fictional detective mystery as JSON. Never use real people. Premise: ${input.scenario}\nDifficulty: ${input.difficulty}. Exactly ${input.suspectCount} suspects. Include evidence types from: ${input.evidencePreferences.join(", ")}. Produce exactly the schema requested: title; case(incidentDescription, incidentLocation, incidentTime ISO string, initialBriefing); suspects array with name, age, role, relationship, publicDescription, motive, alibi, alibiConfidence; culpritIndex (zero-based); solution(motive,method,opportunity,explanation); evidence array with type, title, description, timestamp ISO string, source, relevance and content object; timeline array with description and timestamp ISO string. Include at least one evidence item for each requested type and enough fair, consistent clues to deduce culprit. For message content use {messages:[{senderName,text,timestamp}]}; cctv content {cameraId,location,events:[{timestamp,description}]}; image content {altText,caption}; witness_statement {witnessName,statement}; document {text}. All timestamps must be plausible and chronological. Do not put the culprit in public descriptions or evidence titles.`;
  let parsed;
  let correction = "";
  let lastIssue = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await generateContent(`${prompt}${correction}`);
    try {
      parsed = generatedSchema.parse(JSON.parse(response.text));
      if (parsed.suspects.length !== input.suspectCount)
        throw new Error(`Return exactly ${input.suspectCount} suspects.`);
      if (
        parsed.culpritIndex < 0 ||
        parsed.culpritIndex >= parsed.suspects.length
      )
        throw new Error("culpritIndex must point to an existing suspect.");
      const missing = input.evidencePreferences.filter(
        (type) => !parsed.evidence.some((item) => item.type === type),
      );
      if (missing.length)
        throw new Error(
          `Include at least one evidence item for each missing requested type: ${missing.join(", ")}.`,
        );
      break;
    } catch (error) {
      lastIssue =
        error instanceof z.ZodError
          ? `response schema issues: ${error.issues
              .map(
                (issue) => `${issue.path.join(".") || "root"} (${issue.code})`,
              )
              .slice(0, 8)
              .join(", ")}`
          : error.message;
      if (attempt === 2) {
        console.error("Gemini generated an invalid case:", lastIssue);
        throw Object.assign(
          new Error(
            "The case generator could not satisfy the requested details. Please try generating again.",
          ),
          { status: 502, code: "INVALID_GENERATED_CASE" },
        );
      }
      correction = `\n\nRETRY REQUIREMENTS: Your previous JSON was rejected because ${lastIssue}. Return a corrected complete JSON object. Do not omit any required evidence type.`;
    }
  }
  const suspects = parsed.suspects.map((s) => ({
    ...s,
    alibiConfidence: ["confirmed", "contradicted", "unverified"].includes(
      s.alibiConfidence.toLowerCase(),
    )
      ? s.alibiConfidence.toLowerCase()
      : "unverified",
    id: id(),
    age: s.age ?? null,
    profile: s.publicDescription,
  }));
  const evidence = parsed.evidence.map((e) => ({
    ...e,
    id: id(),
    timestamp: validDate(e.timestamp),
  }));
  const timeline = parsed.timeline
    .map((e) => ({ ...e, id: id(), timestamp: validDate(e.timestamp) }))
    .sort((a, b) => a.timestamp - b.timestamp);
  for (const e of evidence) {
    if (e.type === "message")
      e.content = {
        messages: (e.content.messages || [])
          .map((m) => ({
            ...m,
            id: id(),
            timestamp: validDate(m.timestamp || e.timestamp),
          }))
          .sort((a, b) => a.timestamp - b.timestamp),
      };
    if (e.type === "cctv")
      e.content = {
        ...e.content,
        events: (e.content.events || []).map((x) => ({
          ...x,
          timestamp: validDate(x.timestamp || e.timestamp),
        })),
      };
    if (e.type === "image")
      e.content = {
        altText: e.content.altText || e.description,
        caption: e.content.caption || "",
      };
    if (e.type === "witness_statement")
      e.content = {
        witnessName: e.content.witnessName || "Witness",
        statement: e.content.statement || e.description,
      };
    if (e.type === "document")
      e.content = { text: e.content.text || e.description };
  }
  const culprit = suspects[parsed.culpritIndex];
  return {
    title: parsed.title,
    case: { ...parsed.case, incidentTime: validDate(parsed.case.incidentTime) },
    suspects,
    evidence,
    timeline,
    solution: {
      culpritId: culprit.id,
      culprit: { id: culprit.id, name: culprit.name, role: culprit.role },
      ...parsed.solution,
    },
  };
}
function validDate(v) {
  const d = new Date(v);
  if (!Number.isFinite(d.getTime()))
    throw Object.assign(
      new Error("Generated case contained an invalid date."),
      { status: 502, code: "INVALID_GENERATED_CASE" },
    );
  return d;
}
