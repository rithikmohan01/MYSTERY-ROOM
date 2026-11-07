import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Fingerprint,
  Image,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { api } from "./services/api.js";

const labels = {
  message: "Messages",
  image: "Images",
  cctv: "CCTV",
  witness_statement: "Witness statements",
  document: "Documents & reports",
  timeline_event: "Timeline",
};
const date = (d) =>
  new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
function Header() {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <Fingerprint />
        <span>
          CASE<span className="accent">FILE</span>
          <small>AI MYSTERY ROOM</small>
        </span>
      </Link>
      <nav>
        <NavLink to="/">Overview</NavLink>
        <NavLink to="/history">Your cases</NavLink>
      </nav>
      <Link to="/create" className="button small">
        <Plus size={15} /> New case
      </Link>
    </header>
  );
}
function Shell({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <footer>
        FICTIONAL CASES ONLY <span>·</span> BUILT FOR CURIOSITY{" "}
        <span className="foot-right">AI MYSTERY ROOM / 2026</span>
      </footer>
    </>
  );
}
function Home() {
  const [cases, setCases] = useState([]);
  useEffect(() => {
    api
      .get("/mysteries?limit=3")
      .then((x) => setCases(x.data.items))
      .catch(() => {});
  }, []);
  return (
    <Shell>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <i /> YOUR NEXT CASE IS WAITING
          </div>
          <h1>
            Every clue
            <br />
            tells a <em>story.</em>
          </h1>
          <p className="lede">
            A diamond goes missing. A witness changes their story. The timeline
            doesn’t add up. Create a mystery, follow the evidence, and decide
            who did it.
          </p>
          <div className="actions">
            <Link className="button" to="/create">
              Create a mystery <ArrowRight size={17} />
            </Link>
            <a href="#how" className="text-link">
              How it works ↓
            </a>
          </div>
          <div className="private">
            <LockKeyhole size={14} /> Your cases are private to this browser
            session
          </div>
        </div>
        <div className="case-art">
          <div className="art-head">
            ACTIVE INVESTIGATION <span>● REC</span>
          </div>
          <div className="art-no">CASE NO. 047</div>
          <div className="art-title">
            THE
            <br />
            <i>LAST</i>
            <br />
            LIGHT
          </div>
          <div className="art-meta">
            LOCATION <b>Ravenswood Estate</b> INCIDENT <b>9:42 PM · 24 OCT</b>
          </div>
          <div className="stamp">OPEN</div>
          <div className="art-foot">
            4 SUSPECTS <span>8 EVIDENCE ITEMS</span> STATUS: ACTIVE
          </div>
        </div>
      </section>
      <section id="how" className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">THE INVESTIGATION</div>
            <h2>
              Three steps to <em>the truth.</em>
            </h2>
          </div>
          <p>
            Every detail is generated around your premise, with one answer fixed
            before you begin.
          </p>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Set the scene",
              "Give us a premise, pick your difficulty, and choose the evidence.",
            ],
            [
              "02",
              "Follow the clues",
              "Explore suspect profiles, message threads, reports, and witness accounts.",
            ],
            [
              "03",
              "Make your call",
              "Build your theory, make one final accusation, then see how the evidence fits.",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <span>
                {x[0]} <Sparkles size={17} />
              </span>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section recent">
        <div className="section-head">
          <div>
            <div className="eyebrow">YOUR CASE ARCHIVE</div>
            <h2>
              Back on <em>the case.</em>
            </h2>
          </div>
          <Link className="text-link" to="/history">
            View all cases →
          </Link>
        </div>
        {cases.length ? (
          cases.map((c) => <CaseRow key={c.id} item={c} />)
        ) : (
          <div className="empty">
            <BookOpen />
            <p>Your archive is quiet. Create a mystery to get started.</p>
            <Link to="/create" className="text-link">
              Open your first case →
            </Link>
          </div>
        )}
      </section>
      <div className="disclaimer">
        <Shield size={17} /> Every case, person, and piece of evidence is
        fictional and AI-generated. This is a game, not a tool for real-world
        investigations.
      </div>
    </Shell>
  );
}
function CaseRow({ item: c }) {
  return (
    <Link className="case-row" to={"/case/" + c.id}>
      <FileText />
      <div>
        <b>{c.title}</b>
        <small>
          {c.suspectCount} suspects · {c.difficulty} · {date(c.createdAt)}
        </small>
      </div>
      <span className={"status " + c.status}>{c.status}</span>
      <ArrowRight size={16} />
    </Link>
  );
}
function Create() {
  const nav = useNavigate(),
    [scenario, setScenario] = useState(""),
    [difficulty, setDifficulty] = useState("medium"),
    [count, setCount] = useState(4),
    [prefs, setPrefs] = useState(["message", "cctv", "witness_statement"]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const options = [
    ["message", "Messages", MessageCircle],
    ["image", "Photographs", Image],
    ["cctv", "CCTV simulation", Video],
    ["witness_statement", "Witness statements", BookOpen],
  ];
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (scenario.trim().length < 20) {
      setError(
        "Add at least 20 characters so the investigation has room to develop.",
      );
      return;
    }
    setBusy(true);
    try {
      const x = await api.post("/mysteries", {
        scenario: scenario.trim(),
        difficulty,
        suspectCount: count,
        evidencePreferences: prefs,
      });
      nav("/case/" + x.data.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const toggle = (x) =>
    setPrefs((p) => (p.includes(x) ? p.filter((v) => v !== x) : [...p, x]));
  return (
    <Shell>
      <div className="page">
        <Link to="/" className="back">
          <ArrowLeft size={15} /> Back to overview
        </Link>
        <div className="page-title">
          <div className="eyebrow">NEW INVESTIGATION · 01</div>
          <h1>
            Set the <em>scene.</em>
          </h1>
          <p>
            Give us the starting point. We’ll build the suspects, clues, and
            case around it.
          </p>
        </div>
        <form className="create-grid" onSubmit={submit}>
          <div>
            <label className="field-label">
              THE PREMISE <span>Required</span>
            </label>
            <textarea
              maxLength={3000}
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="A locked room. A missing heirloom. Three people with something to hide…"
              rows={7}
            />
            <div className="field-foot">
              Fictional scenarios only <span>{scenario.length} / 3,000</span>
            </div>
            <div className="examples">
              <b>NEED A STARTING POINT?</b>
              <button
                type="button"
                onClick={() =>
                  setScenario(
                    "A priceless watch vanished during a dinner party at a remote hotel.",
                  )
                }
              >
                A priceless watch vanished during dinner at a remote hotel. →
              </button>
              <button
                type="button"
                onClick={() =>
                  setScenario(
                    "A gallery alarm went silent for six minutes during a private viewing.",
                  )
                }
              >
                A gallery alarm went silent during a private viewing. →
              </button>
            </div>
            <div className="form-section">
              <label className="field-label">
                EVIDENCE TYPES <span>Choose at least one</span>
              </label>
              <div className="prefs">
                {options.map(([id, name, Icon]) => (
                  <button
                    type="button"
                    className={prefs.includes(id) ? "pref checked" : "pref"}
                    key={id}
                    onClick={() => toggle(id)}
                  >
                    <Icon size={17} />
                    {name}
                    {prefs.includes(id) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="error">
                <X size={16} />
                {error}
              </div>
            )}
            <button
              className="button generate"
              disabled={busy || !prefs.length}
            >
              {busy ? (
                <>
                  <i className="spinner" /> Building your case…
                </>
              ) : (
                <>
                  Generate investigation <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="private">
              <LockKeyhole size={13} /> Your case and notes are private to your
              guest session.
            </p>
          </div>
          <aside>
            <label className="field-label">DIFFICULTY</label>
            <div className="difficulty">
              {[
                ["easy", "Easy", "A clear trail"],
                ["medium", "Medium", "A few twists"],
                ["hard", "Hard", "Connect the dots"],
              ].map((x) => (
                <button
                  type="button"
                  key={x[0]}
                  className={difficulty === x[0] ? "chosen" : ""}
                  onClick={() => setDifficulty(x[0])}
                >
                  <i />
                  {x[1]} <small>{x[2]}</small>
                </button>
              ))}
            </div>
            <div className="side-section">
              <label className="field-label">SUSPECTS</label>
              <div className="count">
                <button
                  type="button"
                  onClick={() => setCount(Math.max(3, count - 1))}
                >
                  −
                </button>
                <b>{count}</b>
                <button
                  type="button"
                  onClick={() => setCount(Math.min(6, count + 1))}
                >
                  +
                </button>
              </div>
              <small>Choose between 3 and 6 suspects.</small>
            </div>
            <div className="tip">
              <Sparkles size={16} />
              <p>
                <b>A fair case starts here.</b>
                <br />
                Your culprit is fixed before you investigate. The answer stays
                hidden until your final accusation.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </Shell>
  );
}
function History() {
  const [items, setItems] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/mysteries?limit=50")
      .then((x) => setItems(x.data.items))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Shell>
      <div className="page">
        <div className="page-title">
          <div className="eyebrow">YOUR PRIVATE ARCHIVE</div>
          <h1>
            Case <em>files.</em>
          </h1>
          <p>Pick up where you left off.</p>
        </div>
        {error && <div className="error">{error}</div>}
        {items.length
          ? items.map((c) => <CaseRow key={c.id} item={c} />)
          : !error && (
              <div className="empty">
                <BookOpen />
                <p>No investigations yet.</p>
                <Link className="button" to="/create">
                  Create a mystery <ArrowRight size={15} />
                </Link>
              </div>
            )}
      </div>
    </Shell>
  );
}
function CasePage() {
  const { id } = useParams(),
    [data, setData] = useState(null),
    [err, setErr] = useState(""),
    [tab, setTab] = useState("briefing"),
    [item, setItem] = useState(null),
    [notes, setNotes] = useState(""),
    [accuse, setAccuse] = useState(""),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState("");
  async function load() {
    try {
      const r = await api.get("/mysteries/" + id);
      const raw = r.data;
      const progress = {
        reviewedEvidenceIds: Array.isArray(raw.progress?.reviewedEvidenceIds)
          ? raw.progress.reviewedEvidenceIds
          : [],
        notes:
          typeof raw.progress?.notes === "string" ? raw.progress.notes : "",
        flaggedSuspectIds: Array.isArray(raw.progress?.flaggedSuspectIds)
          ? raw.progress.flaggedSuspectIds
          : [],
      };
      const safe = {
        ...raw,
        status: raw.status || "active",
        difficulty: raw.difficulty || "medium",
        case: raw.case || {},
        suspects: Array.isArray(raw.suspects) ? raw.suspects : [],
        evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
        timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
        progress,
      };
      setData(safe);
      setNotes(progress.notes);
      if (["completed", "abandoned"].includes(safe.status) && safe.solution)
        setResult({
          isCorrect: safe.accusation?.isCorrect ?? null,
          correctSuspect: safe.solution.culprit,
          selectedSuspect: safe.suspects.find(
            (s) => s.id === safe.accusation?.suspectId,
          ),
          solution: safe.solution,
        });
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [id]);
  async function progress(p) {
    if (["completed", "abandoned"].includes(data?.status)) return;
    try {
      const r = await api.patch(`/mysteries/${id}/progress`, {
        ...data.progress,
        ...p,
      });
      setData((d) => ({ ...d, progress: { ...d.progress, ...r.data } }));
    } catch (e) {
      setToast(e.message);
    }
  }
  async function review(e) {
    if (!data.progress.reviewedEvidenceIds.includes(e.id))
      await progress({
        reviewedEvidenceIds: [...data.progress.reviewedEvidenceIds, e.id],
      });
  }
  async function flag(s) {
    const a = data.progress.flaggedSuspectIds,
      ids = a.includes(s.id) ? a.filter((x) => x !== s.id) : [...a, s.id];
    await progress({ flaggedSuspectIds: ids });
  }
  async function saveNotes() {
    await progress({ notes });
    setToast("Notes saved");
    setTimeout(() => setToast(""), 2200);
  }
  async function accusation() {
    if (
      !window.confirm(
        `Accuse ${data.suspects.find((s) => s.id === accuse)?.name}? This cannot be changed.`,
      )
    )
      return;
    setBusy(true);
    try {
      const r = await api.post(`/mysteries/${id}/accusation`, {
        suspectId: accuse,
      });
      setResult(r.data);
      setData((d) => ({ ...d, status: "completed" }));
      setTab("result");
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function reveal() {
    if (
      !window.confirm("Reveal the solution and close this case? This is final.")
    )
      return;
    try {
      const r = await api.post(`/mysteries/${id}/reveal-solution`);
      setResult({
        isCorrect: null,
        revealed: true,
        solution: r.data.solution,
        correctSuspect: r.data.solution.culprit,
      });
      setData((d) => ({ ...d, status: "completed" }));
      setTab("result");
    } catch (e) {
      setToast(e.message);
    }
  }
  if (err)
    return (
      <Shell>
        <div className="page">
          <Link className="back" to="/history">
            ← Your cases
          </Link>
          <div className="error">{err}</div>
        </div>
      </Shell>
    );
  if (!data)
    return (
      <Shell>
        <div className="loading">
          <i className="spinner" /> Opening investigation…
        </div>
      </Shell>
    );
  const evidence = data.evidence || [],
    reviewed = data.progress.reviewedEvidenceIds || [];
  return (
    <Shell>
      <div className="case-page">
        <div className="case-toolbar">
          <Link className="back" to="/history">
            ← CASE ARCHIVE
          </Link>
          <span>
            FILE {id.slice(-6).toUpperCase()} · {data.status.toUpperCase()}
          </span>
        </div>
        <header className="case-heading">
          <div>
            <div className="eyebrow">
              {data.difficulty.toUpperCase()} INVESTIGATION ·{" "}
              {data.suspects.length} SUSPECTS
            </div>
            <h1>{data.title}</h1>
            <p>
              {data.case.incidentLocation} · {date(data.case.incidentTime)}
            </p>
          </div>
          <button
            className="button quiet"
            onClick={reveal}
            disabled={["completed", "abandoned"].includes(data.status)}
          >
            Reveal solution
          </button>
        </header>
        <nav className="case-tabs">
          {[
            ["briefing", "Briefing"],
            ["evidence", `Evidence ${evidence.length}`],
            ["timeline", "Timeline"],
            ["notes", "Case notes"],
            ["result", "Accusation"],
          ].map(([k, v]) => (
            <button
              key={k}
              className={tab === k ? "active" : ""}
              onClick={() => setTab(k)}
            >
              {v}
            </button>
          ))}
        </nav>
        {toast && <div className="notice">{toast}</div>}
        {tab === "briefing" && (
          <div className="investigation">
            <section className="panel">
              <div className="eyebrow">INCIDENT BRIEFING</div>
              <h2>The facts so far</h2>
              <div className="brief-copy">
                <p>{data.case.incidentDescription}</p>
                <p>{data.case.initialBriefing}</p>
              </div>
              <div className="facts">
                <span>LOCATION</span>
                <b>{data.case.incidentLocation}</b>
                <span>INCIDENT TIME</span>
                <b>{date(data.case.incidentTime)}</b>
              </div>
              <div className="section-label">
                <div className="eyebrow">PERSONS OF INTEREST</div>
                <h2>{data.suspects.length} suspects</h2>
              </div>
              <div className="suspects">
                {data.suspects.map((s, i) => (
                  <article className="suspect" key={s.id}>
                    <div className="avatar">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="suspect-info">
                      <h3>
                        {s.name}
                        <small>{s.age}</small>
                      </h3>
                      <div className="muted">
                        {s.role} · {s.relationship}
                      </div>
                      <p>{s.publicDescription || s.profile}</p>
                      <div className="claims">
                        <div>
                          <small>MOTIVE</small>
                          <p>{s.motive}</p>
                        </div>
                        <div>
                          <small>ALIBI · {s.alibiConfidence}</small>
                          <p>{s.alibi}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      className={
                        data.progress.flaggedSuspectIds.includes(s.id)
                          ? "flag active"
                          : "flag"
                      }
                      onClick={() => flag(s)}
                      title="Flag suspect"
                    >
                      <Fingerprint size={17} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <aside className="case-side">
              <div className="panel">
                <div className="eyebrow">CASE PROGRESS</div>
                <p>
                  <b>{reviewed.length}</b> / {evidence.length} evidence reviewed
                </p>
                <div className="progress">
                  <i
                    style={{
                      width: `${evidence.length ? (reviewed.length / evidence.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <button
                  className="text-link"
                  onClick={() => setTab("evidence")}
                >
                  Open evidence room →
                </button>
              </div>
              <div className="panel">
                <div className="eyebrow">INVESTIGATION NOTES</div>
                <textarea
                  className="mini-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What doesn’t add up?"
                  maxLength={5000}
                />
                <button
                  className="button small"
                  onClick={saveNotes}
                  disabled={["completed", "abandoned"].includes(data.status)}
                >
                  Save notes
                </button>
              </div>
              <div className="tip">
                <Shield size={16} />
                <p>Your theory is yours. Flags never reveal guilt.</p>
              </div>
              <button
                className="button full"
                onClick={() => setTab("result")}
                disabled={["completed", "abandoned"].includes(data.status)}
              >
                Make an accusation <ArrowRight size={15} />
              </button>
            </aside>
          </div>
        )}
        {tab === "evidence" && (
          <section className="panel evidence-room">
            <div className="eyebrow">THE EVIDENCE ROOM</div>
            <h2>Every detail matters.</h2>
            <div className="evidence-grid">
              {evidence.map((e) => (
                <button
                  className="evidence"
                  key={e.id}
                  onClick={() => {
                    setItem(e);
                    review(e);
                  }}
                >
                  <div className="evidence-type">
                    {labels[e.type]}{" "}
                    <span>{reviewed.includes(e.id) ? "✓" : "●"}</span>
                  </div>
                  <div className="evidence-icon">
                    {e.type === "message" ? (
                      <MessageCircle />
                    ) : e.type === "image" ? (
                      <Image />
                    ) : e.type === "cctv" ? (
                      <Video />
                    ) : (
                      <FileText />
                    )}
                  </div>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                  <small>{date(e.timestamp)}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        {tab === "timeline" && (
          <section className="panel timeline">
            <div className="eyebrow">MASTER TIMELINE</div>
            <h2>What happened, when.</h2>
            {data.timeline.map((ev, i) => (
              <article key={ev.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <time>{date(ev.timestamp)}</time>
                <p>{ev.description}</p>
              </article>
            ))}
          </section>
        )}
        {tab === "notes" && (
          <section className="panel notes">
            <div className="eyebrow">PRIVATE TO YOUR SESSION</div>
            <h2>Your working theory.</h2>
            <p>Track contradictions, connections, and questions.</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={5000}
              placeholder="The timeline suggests…"
            />
            <div>
              {notes.length} / 5,000{" "}
              <button
                className="button"
                onClick={saveNotes}
                disabled={["completed", "abandoned"].includes(data.status)}
              >
                Save notes
              </button>
            </div>
          </section>
        )}
        {tab === "result" &&
          (result ? (
            <Result result={result} />
          ) : (
            <section className="panel accusation">
              <div className="eyebrow">FINAL ACCUSATION</div>
              <h2>Who did it?</h2>
              <p>
                Choose the person you believe is responsible. You only get one
                final accusation.
              </p>
              {data.suspects.map((s) => (
                <button
                  key={s.id}
                  className={
                    accuse === s.id ? "accuse-option selected" : "accuse-option"
                  }
                  onClick={() => setAccuse(s.id)}
                >
                  <span className="radio" />
                  <b>{s.name}</b>
                  <small>
                    {s.role} · {s.relationship}
                  </small>
                </button>
              ))}
              <button
                className="button"
                disabled={!accuse || busy}
                onClick={accusation}
              >
                {busy ? "Submitting…" : "Confirm accusation"}{" "}
                <ArrowRight size={16} />
              </button>
            </section>
          ))}
      </div>
      {item && (
        <div className="modal-bg" onClick={() => setItem(null)}>
          <article className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setItem(null)}>
              <X />
            </button>
            <div className="eyebrow">
              {labels[item.type]} · {item.source}
            </div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            {item.type === "message" && (
              <div className="chat">
                {item.content.messages?.map((m) => (
                  <div key={m.id} className="bubble">
                    <b>
                      {m.senderName ||
                        data.suspects.find((s) => s.id === m.senderId)?.name}
                    </b>
                    <p>{m.text}</p>
                    <small>{date(m.timestamp)}</small>
                  </div>
                ))}
              </div>
            )}
            {item.type === "image" && (
              <div className="media-placeholder">
                <Image size={35} />
                <b>FICTIONAL EVIDENCE IMAGE</b>
                <span>{item.content.altText || item.description}</span>
                <p>{item.content.caption}</p>
              </div>
            )}
            {item.type === "cctv" && (
              <div className="cctv">
                <Video />
                <b>SIMULATED CCTV · {item.content.cameraId}</b>
                <span>{item.content.location}</span>
                {item.content.events?.map((ev, i) => (
                  <p key={i}>
                    <time>{date(ev.timestamp)}</time>
                    {ev.description}
                  </p>
                ))}
                <small>
                  Transcript simulation — no real recording was generated.
                </small>
              </div>
            )}
            {item.type === "witness_statement" && (
              <blockquote>
                “{item.content.statement}”
                <cite>— {item.content.witnessName}</cite>
              </blockquote>
            )}
            {item.type === "document" && <pre>{item.content.text}</pre>}
            <div className="detail-foot">
              COLLECTED {date(item.timestamp)}
              {item.relevance && <p>{item.relevance}</p>}
            </div>
          </article>
        </div>
      )}
    </Shell>
  );
}
function Result({ result }) {
  return (
    <section className="panel result">
      <div className="result-icon">
        {result.isCorrect === true ? <Check /> : <Fingerprint />}
      </div>
      <div className="eyebrow">
        {result.revealed ? "SOLUTION REVEALED" : "INVESTIGATION COMPLETE"}
      </div>
      <h2>
        {result.isCorrect === null
          ? "The case is closed."
          : result.isCorrect
            ? "A sharp eye."
            : "The evidence points elsewhere."}
      </h2>
      {result.selectedSuspect && (
        <p>
          You accused <b>{result.selectedSuspect.name}</b>. The culprit was{" "}
          <b>{result.correctSuspect?.name}</b>.
        </p>
      )}
      <div className="solution">
        <div>
          <small>THE CULPRIT</small>
          <h3>{result.correctSuspect?.name}</h3>
          <span>{result.correctSuspect?.role}</span>
        </div>
        {[
          ["MOTIVE", result.solution.motive],
          ["METHOD", result.solution.method],
          ["OPPORTUNITY", result.solution.opportunity],
          ["HOW THE EVIDENCE FITS", result.solution.explanation],
        ].map(([title, text]) => (
          <article key={title}>
            <small>{title}</small>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <Link className="button" to="/create">
        Create another mystery <ArrowRight size={16} />
      </Link>
    </section>
  );
}
function NotFound() {
  return (
    <Shell>
      <div className="empty">
        <h1>That page is off the record.</h1>
        <Link className="button" to="/">
          Return to overview
        </Link>
      </div>
    </Shell>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<Create />} />
      <Route path="/history" element={<History />} />
      <Route path="/case/:id" element={<CasePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
