import { useState, useRef } from "react";

const LEVELS = [
  {
    id: "mild",
    label: "Mild",
    tag: "Spicy but kind",
    system: "You're a witty career coach doing a light comedy roast. Be funny and a bit cheeky but ultimately warm. Make 3–4 specific, funny observations that reference real things in the resume. Call out buzzwords or vague claims gently. End with 3 genuinely useful improvement tips labeled clearly."
  },
  {
    id: "medium",
    label: "Medium",
    tag: "Actually burns",
    system: "You're a sharp recruiter hosting a proper roast. Be genuinely funny, specific, and a bit savage — call out every cliché, every vague bullet point, every inflated job title you see. Don't sugarcoat it. Be merciless but constructive. End with 3 real improvement tips labeled clearly."
  },
  {
    id: "savage",
    label: "Savage",
    tag: "No survivors",
    system: "You are a brutal comedy roast MC with absolutely zero mercy. Obliterate this resume. Mock every buzzword, every 'team player', every 'passionate about synergies', every gap, every weak verb, every lie you can smell. Be hilarious, specific, and relentlessly savage. Leave nothing standing. But — because even monsters have hearts — end with 3 genuinely useful improvement tips labeled clearly."
  }
];

const LOADING_LINES = [
  "Summoning the roast judges...",
  "Reading between the lies...",
  "Highlighting the buzzwords (all of them)...",
  "Consulting the cringe council...",
  "Preparing your public shaming..."
];

const s = {
  wrap: {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: "#f2ede6",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: "2.5rem 1.5rem 4rem",
    maxWidth: 680,
    margin: "0 auto",
    boxSizing: "border-box"
  },
  title: {
    fontSize: "clamp(2.2rem, 7vw, 3.8rem)",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    margin: 0,
    color: "#f2ede6"
  },
  titleFire: { color: "#e84040" },
  subtitle: {
    fontSize: "0.9rem",
    color: "#666",
    fontStyle: "italic",
    marginBottom: "2.5rem",
    marginTop: "0.4rem"
  },
  section: { marginBottom: "1.75rem" },
  label: {
    display: "block",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: "0.75rem",
    fontFamily: "'Courier New', monospace"
  },
  tabRow: {
    display: "flex",
    gap: "2px",
    background: "#1a1a1a",
    borderRadius: 8,
    padding: 3,
    marginBottom: "1rem",
    width: "fit-content"
  },
  tab: (active) => ({
    padding: "0.5rem 1.25rem",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "'Courier New', monospace",
    background: active ? "#f2ede6" : "transparent",
    color: active ? "#0d0d0d" : "#888",
    transition: "all 0.15s ease",
    fontWeight: active ? 700 : 400
  }),
  textarea: {
    width: "100%",
    minHeight: 220,
    background: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    color: "#f2ede6",
    fontFamily: "'Courier New', monospace",
    fontSize: "0.82rem",
    lineHeight: 1.7,
    padding: "1rem 1.1rem",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  dropZone: (dragging, hasFile) => ({
    width: "100%",
    minHeight: 180,
    background: dragging ? "#1a1a1a" : "#141414",
    border: `1.5px dashed ${hasFile ? "#e84040" : dragging ? "#e84040" : "#333"}`,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    gap: "0.5rem",
    boxSizing: "border-box",
    padding: "1.5rem"
  }),
  dropIcon: { fontSize: "2rem", opacity: 0.5 },
  dropText: {
    fontSize: "0.85rem",
    color: "#666",
    textAlign: "center",
    fontFamily: "'Courier New', monospace"
  },
  fileName: {
    fontSize: "0.8rem",
    color: "#e84040",
    fontFamily: "'Courier New', monospace",
    marginTop: "0.5rem",
    textAlign: "center"
  },
  levelRow: { display: "flex", gap: "10px" },
  levelBtn: (active) => ({
    flex: 1,
    padding: "0.75rem 0.5rem",
    background: active ? "#e84040" : "#141414",
    border: `1px solid ${active ? "#e84040" : "#2a2a2a"}`,
    borderRadius: 10,
    color: active ? "#fff" : "#777",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.15s ease",
    fontFamily: "'Courier New', monospace"
  }),
  levelName: (active) => ({
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: active ? "#fff" : "#aaa",
    marginBottom: "2px"
  }),
  levelTag: (active) => ({
    display: "block",
    fontSize: "0.65rem",
    letterSpacing: "0.05em",
    color: active ? "rgba(255,255,255,0.7)" : "#555"
  }),
  roastBtn: (loading) => ({
    width: "100%",
    padding: "1rem",
    background: loading ? "#2a2a2a" : "#e84040",
    border: "none",
    borderRadius: 10,
    color: loading ? "#666" : "#fff",
    fontSize: "1rem",
    fontWeight: 700,
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.02em",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
    marginTop: "0.5rem"
  }),
  error: {
    fontSize: "0.8rem",
    color: "#e84040",
    fontFamily: "'Courier New', monospace",
    marginTop: "0.5rem",
    padding: "0.6rem 0.9rem",
    background: "rgba(232, 64, 64, 0.08)",
    borderRadius: 6,
    border: "1px solid rgba(232, 64, 64, 0.2)"
  },
  roastBox: {
    marginTop: "2rem",
    background: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "1.5rem 1.4rem",
    animation: "fadeIn 0.4s ease"
  },
  roastHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
    paddingBottom: "0.9rem",
    borderBottom: "1px solid #222"
  },
  roastHeaderLabel: {
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#e84040",
    fontFamily: "'Courier New', monospace"
  },
  roastText: {
    fontSize: "0.9rem",
    lineHeight: 1.85,
    color: "#d4cfc8",
    fontFamily: "'Courier New', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  loadingDots: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    justifyContent: "center"
  },
  dot: (i) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#e84040",
    animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`
  }),
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "#1e1e1e",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    fontSize: "0.65rem",
    color: "#666",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.08em"
  }
};

export default function RoastMyResume() {
  const [tab, setTab] = useState("paste");
  const [text, setText] = useState("");
  const [level, setLevel] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const fileRef = useRef();
  const loadingRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("PDF only please. We can't roast a .docx, we have standards.");
      return;
    }
    setError("");
    setFileName(file.name);
  };

  const handleRoast = async () => {
    if (tab === "paste" && !text.trim()) {
      setError("Can't roast nothing. Paste your resume first.");
      return;
    }
    if (tab === "upload" && !fileName) {
      setError("Upload a PDF first. Your resume, not your cat photos.");
      return;
    }
    setError("");
    setLoading(true);
    setRoast("");
    let lineIdx = 0;
    setLoadingLine(0);
    loadingRef.current = setInterval(() => {
      lineIdx = (lineIdx + 1) % LOADING_LINES.length;
      setLoadingLine(lineIdx);
    }, 1800);

    const selectedLevel = LEVELS.find(l => l.id === level);

    try {
      const messages = [
        { role: "system", content: selectedLevel.system },
        { role: "user", content: `Here is my resume. Roast it:\n\n${text}` }
      ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const result = data.choices?.[0]?.message?.content;
      if (!result) throw new Error("No response returned.");
      setRoast(result);
    } catch (err) {
      setError("Something broke: " + err.message);
    } finally {
      clearInterval(loadingRef.current);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        textarea:focus { border-color: #e84040 !important; }
        textarea::placeholder { color: #3a3a3a; }
        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-track { background: #0d0d0d; }
        textarea::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
      `}</style>

      <div style={s.wrap}>
        <div>
          <h1 style={s.title}>
            Roast My<br /><span style={s.titleFire}>Resume.</span>
          </h1>
          <p style={s.subtitle}>paste it in. we'll do the rest.</p>
        </div>

        <div style={s.section}>
          <span style={s.label}>01 — Your Resume</span>
          <div style={s.tabRow}>
            <button style={s.tab(tab === "paste")} onClick={() => setTab("paste")}>Paste Text</button>
            <button style={s.tab(tab === "upload")} onClick={() => setTab("upload")}>Upload PDF</button>
          </div>

          {tab === "paste" ? (
            <textarea
              style={s.textarea}
              placeholder="Paste your full resume here. Education, experience, skills, the works..."
              value={text}
              onChange={e => setText(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div
              style={s.dropZone(dragging, !!fileName)}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <div style={s.dropIcon}>{fileName ? "✓" : "↑"}</div>
              {fileName ? (
                <p style={s.fileName}>{fileName}</p>
              ) : (
                <>
                  <p style={s.dropText}>Drop your PDF here or click to browse</p>
                  <p style={{ ...s.dropText, fontSize: "0.75rem", opacity: 0.6 }}>PDF only</p>
                </>
              )}
            </div>
          )}
        </div>

        <div style={s.section}>
          <span style={s.label}>02 — Heat Level</span>
          <div style={s.levelRow}>
            {LEVELS.map(l => (
              <button key={l.id} style={s.levelBtn(level === l.id)} onClick={() => setLevel(l.id)}>
                <span style={s.levelName(level === l.id)}>{l.label}</span>
                <span style={s.levelTag(level === l.id)}>{l.tag}</span>
              </button>
            ))}
          </div>
        </div>

        <button style={s.roastBtn(loading)} onClick={handleRoast} disabled={loading}>
          {loading ? "Roasting..." : "Roast Me"}
        </button>

        {error && <div style={s.error}>{error}</div>}

        {loading && (
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <div style={s.loadingDots}>
              {[0, 1, 2].map(i => <div key={i} style={s.dot(i)} />)}
            </div>
            <p style={{ fontSize: "0.78rem", color: "#555", fontFamily: "'Courier New', monospace", marginTop: "0.75rem" }}>
              {LOADING_LINES[loadingLine]}
            </p>
          </div>
        )}

        {roast && !loading && (
          <div style={s.roastBox}>
            <div style={s.roastHeader}>
              <span style={s.roastHeaderLabel}>The Verdict</span>
              <span style={s.badge}>{LEVELS.find(l => l.id === level)?.label} roast</span>
            </div>
            <pre style={s.roastText}>{roast}</pre>
          </div>
        )}
      </div>
    </>
  );
}