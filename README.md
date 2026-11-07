# AI Mystery Room

An AI-powered detective game built from the requirements in `spec.md`. The React client talks to an Express API. The API owns guest access, Gemini generation, case validation, persistence, progress and accusation evaluation; the private solution never leaves the server before a reveal.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer (local instance or hosted URI)
- A Google Gemini API key for mystery generation

## Start locally

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`, `SESSION_SECRET` and `GEMINI_API_KEY`.
2. Copy `client/.env.example` to `client/.env` if the API is not at its default address.
3. Run `npm install` to install the client and server workspaces.
4. Run `npm run dev`; the client is at `http://localhost:5173` and API at `http://localhost:5000`.

Generation uses the configured Gemini model. A missing AI key or database produces a clear error; the app does not silently serve a fabricated case. Image media uses labeled, text-based placeholders and CCTV uses a simulation/transcript unless a real media provider is added. See [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATA_MODEL.md](docs/DATA_MODEL.md) and [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

All investigations and evidence are fictional. This app is not for real-world investigations or accusations. See [the implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md) for the current coverage and remaining work.
