import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT) || 5000;
try {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production")
    throw new Error("SESSION_SECRET is required in production");
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  app.listen(port, () =>
    console.log(
      `Mystery API listening on port ${port} (Gemini model: ${process.env.GEMINI_MODEL || "gemini-3.8-flash"})`,
    ),
  );
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exitCode = 1;
}
