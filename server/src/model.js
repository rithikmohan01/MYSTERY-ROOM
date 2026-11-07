import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    title: String,
    difficulty: String,
    case: mongoose.Schema.Types.Mixed,
    suspects: [mongoose.Schema.Types.Mixed],
    evidence: [mongoose.Schema.Types.Mixed],
    timeline: [mongoose.Schema.Types.Mixed],
    solution: mongoose.Schema.Types.Mixed,
    progress: {
      reviewedEvidenceIds: [String],
      notes: { type: String, default: "" },
      flaggedSuspectIds: [String],
    },
    accusation: { suspectId: String, isCorrect: Boolean, submittedAt: Date },
  },
  { timestamps: true, minimize: false },
);
schema.index({ ownerId: 1, createdAt: -1 });
export const Investigation =
  mongoose.models.Investigation || mongoose.model("Investigation", schema);
