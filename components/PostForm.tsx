"use client";

/**
 * ============================================================================
 * THE POST FORM — create and edit projects (used by /post)
 * ============================================================================
 *
 * Everything is optional; the Post button is at the very bottom. Sections,
 * in order: name/description → prompted questions → instructions → 3D files
 * → code (paste / files / zip) → hardware detection bot → hardware
 * checkboxes → custom hardware → video → images → difficulty → bot-check
 * placeholder → Post.
 *
 * ⚠️ SITE-WIDE DEPENDENCIES — fields other pages rely on. If you remove a
 * field here, check these first:
 *   - difficulty  → the feed filter, the card dots, AND 'red' auto-routes
 *                   posts to /advanced (lib/posts.ts inputToPostColumns)
 *   - advanced    → what /advanced shows
 *   - hardwareIds → feed chips, the parts filter, featured-board filter row
 *                   (ids must exist in config/hardware.ts)
 *   - priceEstimate → the cost-bracket filter + "~$" on cards
 *   - videoUrl    → card thumbnails + "has video" filter
 *   - answers     → keyed by question ids from config/promptedQuestions.ts
 * ============================================================================
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hardware, hardwareById, hardwareCategories } from "@/config/hardware";
import { promptedQuestions } from "@/config/promptedQuestions";
import { detectHardware, type Detection } from "@/lib/detectHardware";
import { compressImage } from "@/lib/imageCompress";
import type { Difficulty, PostInput } from "@/lib/types";
import BotCheck from "./BotCheck";

type UploadedFile = { url: string; path: string | null; filename: string };

const EMPTY_DETECTION: Detection = {
  detectedIds: [],
  reasons: {},
  suggestions: [],
  footnote: null,
};

export default function PostForm({
  editId,
  viewerUsername,
}: {
  /** When set, the form loads this post and saves edits (new version). */
  editId: string | null;
  /** Signed-in username, or null (→ anonymous posting flow). */
  viewerUsername: string | null;
}) {
  const router = useRouter();

  // ---- core fields ---------------------------------------------------------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [price, setPrice] = useState("");

  // ---- code ----------------------------------------------------------------
  const [codeText, setCodeText] = useState("");
  const [codeFiles, setCodeFiles] = useState<UploadedFile[]>([]);
  /** Text pulled out of uploaded code files / zips — feeds the detection bot. */
  const [extractedCode, setExtractedCode] = useState<Record<string, string>>({});

  // ---- files -----------------------------------------------------------------
  const [models, setModels] = useState<UploadedFile[]>([]);
  const [modelLinks, setModelLinks] = useState<string[]>([]);
  const [modelLinkInput, setModelLinkInput] = useState("");
  const [images, setImages] = useState<UploadedFile[]>([]);

  // ---- hardware ---------------------------------------------------------------
  const [checked, setChecked] = useState<string[]>([]);
  /** Ids the poster explicitly un-ticked — the bot won't re-tick them. */
  const userUnchecked = useRef<Set<string>>(new Set());
  const [customRows, setCustomRows] = useState<{ name: string; link: string; price: string }[]>([]);
  const [hwSearch, setHwSearch] = useState("");
  const [detection, setDetection] = useState<Detection>(EMPTY_DETECTION);

  // ---- flow state ----------------------------------------------------------------
  const [aiOn, setAiOn] = useState(false);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState(""); // typed in for anon edits
  const [needsPassword, setNeedsPassword] = useState(false);
  /** After an anonymous post succeeds: { id, password } shown exactly ONCE. */
  const [anonSuccess, setAnonSuccess] = useState<{ id: string; password: string } | null>(null);

  // Is the ✨ AI button live? (It stays disabled until the owner adds a key —
  // see lib/ai.ts.)
  useEffect(() => {
    fetch("/api/ai").then((r) => r.json()).then((d) => setAiOn(Boolean(d.enabled))).catch(() => {});
  }, []);

  // ---- edit mode: load the existing post -------------------------------------
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const res = await fetch(`/api/posts/${editId}`);
      if (!res.ok) { setError("Couldn't load that post."); return; }
      const { post, isAnonymous } = await res.json();
      setName(post.name ?? "");
      setDescription(post.description ?? "");
      setAnswers(post.answers ?? {});
      setInstructions(post.instructions ?? "");
      setCodeText(post.code_text ?? "");
      setVideoUrl(post.video_url ?? "");
      setDifficulty(post.difficulty ?? null);
      setAdvanced(Boolean(post.advanced));
      setPrice(post.price_estimate != null ? String(post.price_estimate) : "");
      setChecked(
        post.post_hardware.filter((h: { hardware_id: string | null }) => h.hardware_id)
          .map((h: { hardware_id: string }) => h.hardware_id)
      );
      setCustomRows(
        post.post_hardware
          .filter((h: { custom_name: string | null }) => h.custom_name)
          .map((h: { custom_name: string; custom_link: string | null; custom_price: number | null }) => ({
            name: h.custom_name,
            link: h.custom_link ?? "",
            price: h.custom_price != null ? String(h.custom_price) : "",
          }))
      );
      type FileRow = { kind: string; url: string; storage_path: string | null; filename: string | null; is_external: boolean };
      const files: FileRow[] = post.post_files ?? [];
      setImages(files.filter((f) => f.kind === "image").map((f) => ({ url: f.url, path: f.storage_path, filename: f.filename ?? "image" })));
      setModels(files.filter((f) => f.kind === "model" && !f.is_external).map((f) => ({ url: f.url, path: f.storage_path, filename: f.filename ?? "model" })));
      setModelLinks(files.filter((f) => f.kind === "model" && f.is_external).map((f) => f.url));
      setCodeFiles(files.filter((f) => f.kind === "code").map((f) => ({ url: f.url, path: f.storage_path, filename: f.filename ?? "code" })));
      setNeedsPassword(Boolean(isAnonymous));
    })();
  }, [editId]);

  // ---- THE DETECTION BOT (not AI) ---------------------------------------------
  // Re-scan whenever any code changes: pasted text + text extracted from
  // uploaded files/zips. Auto-checks findings, except ids the poster
  // explicitly un-ticked. Patterns live in config/codePatterns.ts.
  useEffect(() => {
    const allCode = [codeText, ...Object.values(extractedCode)].join("\n");
    const result = detectHardware(allCode);
    setDetection(result);
    setChecked((prev) => {
      const next = [...prev];
      for (const id of result.detectedIds) {
        if (!next.includes(id) && !userUnchecked.current.has(id)) next.push(id);
      }
      return next;
    });
  }, [codeText, extractedCode]);

  const toggleHardware = (id: string) => {
    setChecked((prev) => {
      if (prev.includes(id)) {
        userUnchecked.current.add(id); // remember: the human said no
        return prev.filter((x) => x !== id);
      }
      userUnchecked.current.delete(id);
      return [...prev, id];
    });
  };

  // ---- uploads ---------------------------------------------------------------
  const uploadToServer = useCallback(
    async (data: Blob, filename: string, kind: "image" | "model" | "code"): Promise<UploadedFile | null> => {
      const form = new FormData();
      form.append("file", new File([data], filename, { type: data.type }));
      form.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Upload failed."); return null; }
      setError(null);
      return { url: json.url, path: json.path, filename: json.filename };
    },
    []
  );

  /** Images: compress in the browser first (max 1200px WebP), then upload. */
  const onPickImages = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      try {
        const { blob, filename } = await compressImage(file);
        const up = await uploadToServer(blob, filename, "image");
        if (up) setImages((prev) => [...prev, up]);
      } catch {
        setError(`Couldn't process image ${file.name}.`);
      }
    }
    setUploading(false);
  };

  const onPickModels = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const up = await uploadToServer(file, file.name, "model");
      if (up) setModels((prev) => [...prev, up]);
    }
    setUploading(false);
  };

  /** Code files: upload AND read their text so the detection bot can scan it. */
  const onPickCodeFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        await handleZip(file);
        continue;
      }
      try {
        const text = await file.text();
        setExtractedCode((prev) => ({ ...prev, [file.name]: text.slice(0, 200_000) }));
      } catch { /* binary file — skip scanning, still upload it */ }
      const up = await uploadToServer(file, file.name, "code");
      if (up) setCodeFiles((prev) => [...prev, up]);
    }
    setUploading(false);
  };

  /** Zip (a whole folder): upload it, and scan the text files inside. */
  const handleZip = async (file: File) => {
    const up = await uploadToServer(file, file.name, "code");
    if (up) setCodeFiles((prev) => [...prev, up]);
    try {
      // jszip is loaded on demand — most posters never upload a zip.
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const textExt = /\.(ino|c|cpp|h|hpp|py|js|ts|txt|md|json|yaml|yml)$/i;
      let combined = "";
      for (const entry of Object.values(zip.files)) {
        if (entry.dir || !textExt.test(entry.name)) continue;
        if (combined.length > 300_000) break; // enough for the bot
        combined += "\n" + (await entry.async("string"));
      }
      if (combined) setExtractedCode((prev) => ({ ...prev, [file.name]: combined }));
    } catch {
      /* unreadable zip — fine, it's still uploaded for humans */
    }
  };

  // ---- price suggestion ---------------------------------------------------------
  const suggestPrice = () => {
    let total = 0;
    for (const id of checked) total += hardwareById[id]?.price ?? 0;
    for (const row of customRows) total += parseFloat(row.price) || 0;
    if (total > 0) setPrice(String(Math.round(total)));
  };

  // ---- submit ----------------------------------------------------------------------
  const submit = async () => {
    setSaving(true);
    setError(null);

    const input: PostInput = {
      name,
      description,
      answers,
      instructions,
      codeText,
      videoUrl,
      difficulty,
      advanced,
      priceEstimate: price.trim() === "" ? null : parseFloat(price) || null,
      hardwareIds: checked,
      customHardware: customRows.map((r) => ({
        name: r.name,
        link: r.link,
        price: r.price.trim() === "" ? null : parseFloat(r.price) || null,
      })),
      files: [
        ...images.map((f) => ({ kind: "image" as const, url: f.url, storagePath: f.path, filename: f.filename, isExternal: false })),
        ...models.map((f) => ({ kind: "model" as const, url: f.url, storagePath: f.path, filename: f.filename, isExternal: false })),
        ...modelLinks.map((url) => ({ kind: "model" as const, url, storagePath: null, filename: url.split("/").pop() ?? null, isExternal: true })),
        ...codeFiles.map((f) => ({ kind: "code" as const, url: f.url, storagePath: f.path, filename: f.filename, isExternal: false })),
      ],
    };

    try {
      if (editId) {
        const res = await fetch(`/api/posts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, password: editPassword || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Save failed.");
        router.push(`/p/${editId}`);
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Post failed.");
        if (data.editPassword) {
          // Anonymous post → show the one-time password screen.
          setAnonSuccess({ id: data.id, password: data.editPassword });
        } else {
          router.push(`/p/${data.id}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!editId) return;
    if (!confirm("Really delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/posts/${editId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: editPassword || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Delete failed."); return; }
    router.push("/");
  };

  // =============================================================================
  // Anonymous-post success screen: the password is shown exactly ONCE.
  // =============================================================================
  if (anonSuccess) {
    return (
      <div className="panel">
        <h1>🎉 Posted!</h1>
        <div className="notice-danger notice">
          <strong>⚠️ COPY THIS PASSWORD NOW — it will never be shown again.</strong>
          <br />
          It is the ONLY way to edit or delete your post (you posted without an
          account). We can&apos;t recover it for you.
        </div>
        <div className="spacer" />
        <div className="password-reveal">{anonSuccess.password}</div>
        <div className="spacer" />
        <div className="chips" style={{ gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => navigator.clipboard.writeText(anonSuccess.password)}
          >
            📋 Copy password
          </button>
          <Link className="btn" href={`/p/${anonSuccess.id}`}>
            I saved it — show me my post →
          </Link>
        </div>
        <p className="muted small">
          To edit later: open your post, hit Edit, and paste this password.
        </p>
      </div>
    );
  }

  // =============================================================================
  // The form itself
  // =============================================================================
  const filteredHardware = hwSearch.trim()
    ? hardware.filter((h) => h.name.toLowerCase().includes(hwSearch.trim().toLowerCase()))
    : hardware;

  return (
    <div>
      <h1>{editId ? "✏️ Edit project" : "🛠️ New project"}</h1>
      <p className="tagline">
        Everything is optional — share what you have. You can edit later
        (every edit is saved as a new version, nothing is ever lost).
      </p>

      {/* Signed-out banner: the two options, right on the page. */}
      {!viewerUsername && !editId && (
        <div className="notice" style={{ marginBottom: 18 }}>
          You&apos;re not signed in. Two options:
          <br />
          <strong>a)</strong> <Link href="/login?next=/post">Sign in / create an account</Link>{" "}
          so the post lives on your personal page, or
          <br />
          <strong>b)</strong> just post — you&apos;ll get a one-time edit password at the end.
        </div>
      )}

      {/* Anonymous edit: needs the one-time password. */}
      {editId && needsPassword && (
        <div className="panel">
          <div className="field">
            <label>🔑 Edit password for this anonymous post</label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="the password you were shown when you posted"
            />
          </div>
        </div>
      )}

      {/* --- 1. name + description ------------------------------------------- */}
      <div className="panel">
        <div className="field">
          <label>Project name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Desk Cleaning Robot Arm" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is it? What does it do?" />
        </div>
      </div>

      {/* --- 2. prompted questions (config/promptedQuestions.ts) --------------- */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>A few helpful questions (optional)</h3>
        {promptedQuestions.map((q) => (
          <div className="field" key={q.id}>
            <label>{q.question}</label>
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder={q.placeholder}
            />
          </div>
        ))}
      </div>

      {/* --- 3. instructions ---------------------------------------------------- */}
      <div className="panel">
        <div className="field">
          <label>🔧 Build instructions</label>
          <p className="hint">
            Tip: refer to your STL files by name so builders can follow along —
            e.g. “Attach <code>arm_base.stl</code> to <code>servo_mount.stl</code> with two M3 screws.”
          </p>
          <textarea
            style={{ minHeight: 180 }}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"1. Print all the STL files below.\n2. Attach arm_base.stl to servo_mount.stl with two M3 screws.\n3. ..."}
          />
          {/* AI hook — disabled until the owner adds a key (see lib/ai.ts). */}
          <div>
            <button
              className="btn"
              disabled={!aiOn}
              title={aiOn ? "Draft instructions from your code + parts" : "Coming soon — the site owner hasn't enabled AI yet"}
              onClick={async () => {
                const res = await fetch("/api/ai", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: codeText, parts: checked }),
                });
                const data = await res.json();
                if (data.suggestion) setInstructions(data.suggestion);
              }}
            >
              ✨ Suggest instructions
            </button>
          </div>
        </div>
      </div>

      {/* --- 4. 3D files ----------------------------------------------------------- */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>🧊 3D files (STL / 3MF)</h3>
        <div className="field">
          <label>Upload small files (≤4MB each — uploaded STLs get a 3D viewer)</label>
          <input type="file" multiple accept=".stl,.3mf,.obj,.step,.stp,.scad,.gcode" onChange={(e) => onPickModels(e.target.files)} />
        </div>
        {models.map((m, i) => (
          <p key={m.url} className="small" style={{ margin: "4px 0" }}>
            🧊 {m.filename}{" "}
            <button className="chip chip-muted" onClick={() => setModels(models.filter((_, j) => j !== i))}>remove</button>
          </p>
        ))}
        <div className="field">
          <label>…or paste external links (GitHub repo, Printables, direct file URLs)</label>
          <p className="hint">Direct links to .stl files get the in-browser 3D viewer too. GitHub “blob” links are converted automatically.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={modelLinkInput} onChange={(e) => setModelLinkInput(e.target.value)} placeholder="https://github.com/you/robot/blob/main/arm_base.stl" />
            <button
              className="btn"
              onClick={() => {
                if (modelLinkInput.trim()) {
                  setModelLinks([...modelLinks, modelLinkInput.trim()]);
                  setModelLinkInput("");
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
        {modelLinks.map((url, i) => (
          <p key={url + i} className="small" style={{ margin: "4px 0" }}>
            🔗 {url}{" "}
            <button className="chip chip-muted" onClick={() => setModelLinks(modelLinks.filter((_, j) => j !== i))}>remove</button>
          </p>
        ))}
      </div>

      {/* --- 5. code ------------------------------------------------------------------ */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>💻 Code</h3>
        <div className="field">
          <label>Upload code file(s)…</label>
          <input type="file" multiple accept=".ino,.c,.cpp,.h,.hpp,.py,.js,.ts,.json,.txt,.md,.yaml,.yml" onChange={(e) => onPickCodeFiles(e.target.files)} />
        </div>
        <div className="field">
          <label>…or a whole folder as a .zip…</label>
          <input type="file" accept=".zip" onChange={(e) => onPickCodeFiles(e.target.files)} />
        </div>
        {codeFiles.map((f, i) => (
          <p key={f.url} className="small" style={{ margin: "4px 0" }}>
            📄 {f.filename}{" "}
            <button
              className="chip chip-muted"
              onClick={() => {
                setCodeFiles(codeFiles.filter((_, j) => j !== i));
                setExtractedCode((prev) => {
                  const next = { ...prev };
                  delete next[f.filename];
                  return next;
                });
              }}
            >
              remove
            </button>
          </p>
        ))}
        <div className="field">
          <label>…or paste code here</label>
          <textarea
            style={{ minHeight: 160, fontFamily: "var(--mono)", fontSize: "0.85rem" }}
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            placeholder={"#include <Servo.h>\n\nvoid setup() { ... }"}
          />
        </div>

        {/* --- 6. what the detection bot found (config/codePatterns.ts) -------- */}
        {(detection.detectedIds.length > 0 || detection.suggestions.length > 0) && (
          <div className="notice-ok notice">
            🤖 <strong>Parts bot</strong> (simple pattern-matching, not AI) scanned your code:
            {detection.detectedIds.length > 0 && (
              <p style={{ margin: "6px 0 0" }}>
                Auto-checked below:{" "}
                {detection.detectedIds.map((id) => hardwareById[id]?.name ?? id).join(", ")} — un-tick anything it got wrong.
              </p>
            )}
            {detection.suggestions.map((s) => (
              <p key={s.label} style={{ margin: "6px 0 0" }}>
                💡 {s.label}{" "}
                {s.hardwareIds.map((id) => (
                  <button key={id} className="chip" onClick={() => !checked.includes(id) && toggleHardware(id)}>
                    + {hardwareById[id]?.name ?? id}
                  </button>
                ))}
              </p>
            ))}
            {detection.footnote && <p style={{ margin: "6px 0 0" }}><em>{detection.footnote}</em></p>}
          </div>
        )}
      </div>

      {/* --- 7. hardware checkboxes (config/hardware.ts) --------------------------- */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>🔩 Hardware used</h3>
        <div className="field">
          <input type="text" value={hwSearch} onChange={(e) => setHwSearch(e.target.value)} placeholder="Search parts…" />
        </div>
        {hardwareCategories.map((cat) => {
          const items = filteredHardware.filter((h) => h.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="hw-category">
              <div className="hw-cat-name">{cat}</div>
              {items.map((h) => (
                <label key={h.id} className="hw-option">
                  <input type="checkbox" checked={checked.includes(h.id)} onChange={() => toggleHardware(h.id)} />
                  <span>
                    {h.name}
                    {h.note && <span className="muted small"> — {h.note}</span>}
                  </span>
                  {detection.detectedIds.includes(h.id) && checked.includes(h.id) && (
                    <span className="badge-detected" title={(detection.reasons[h.id] ?? []).join(", ")}>
                      detected from code
                    </span>
                  )}
                </label>
              ))}
            </div>
          );
        })}

        {/* --- 8. custom hardware ------------------------------------------------ */}
        <h3>Custom parts (not in the list)</h3>
        {customRows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <input style={{ flex: "2 1 160px" }} type="text" placeholder="Part name" value={row.name}
              onChange={(e) => setCustomRows(customRows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} />
            <input style={{ flex: "2 1 160px" }} type="url" placeholder="Buy link (optional)" value={row.link}
              onChange={(e) => setCustomRows(customRows.map((r, j) => (j === i ? { ...r, link: e.target.value } : r)))} />
            <input style={{ flex: "1 1 80px" }} type="number" placeholder="$" value={row.price}
              onChange={(e) => setCustomRows(customRows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))} />
            <button className="chip chip-muted" onClick={() => setCustomRows(customRows.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="btn" onClick={() => setCustomRows([...customRows, { name: "", link: "", price: "" }])}>
          ＋ Add custom part
        </button>
      </div>

      {/* --- 9. video ------------------------------------------------------------------- */}
      <div className="panel">
        <div className="field">
          <label>🎬 Video link (YouTube etc. — videos are never uploaded here)</label>
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        </div>
      </div>

      {/* --- 10. images -------------------------------------------------------------------- */}
      <div className="panel">
        <div className="field">
          <label>📷 Photos (compressed in your browser before upload)</label>
          <input type="file" multiple accept="image/*" onChange={(e) => onPickImages(e.target.files)} />
        </div>
        <div className="chips">
          {images.map((img, i) => (
            <span key={img.url} style={{ position: "relative" }}>
              <img src={img.url} alt={img.filename} style={{ height: 72, borderRadius: 8 }} />
              <button className="chip chip-muted" onClick={() => setImages(images.filter((_, j) => j !== i))}>✕</button>
            </span>
          ))}
        </div>
      </div>

      {/* --- 11. difficulty ---------------------------------------------------------------- */}
      <div className="panel">
        <div className="field">
          <label>Difficulty</label>
          <div className="chips">
            {([["green", "🟢 Plug & play"], ["yellow", "🟡 Some assembly"], ["red", "🔴 Advanced"]] as const).map(([d, label]) => (
              <button key={d} className={`chip ${difficulty === d ? "chip-on" : ""}`} onClick={() => setDifficulty(difficulty === d ? null : d)}>
                {label}
              </button>
            ))}
          </div>
          <p className="hint">🔴 Advanced projects also appear on the <Link href="/advanced">Advanced page</Link>.</p>
          <label className="hw-option" style={{ paddingLeft: 0 }}>
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            <span>Flag as advanced anyway (even if not 🔴)</span>
          </label>
        </div>
        <div className="field">
          <label>Estimated total cost ($)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 25" style={{ maxWidth: 140 }} />
            <button className="btn" onClick={suggestPrice} title="Adds up rough prices of the checked parts">Σ Suggest from parts</button>
          </div>
        </div>
      </div>

      {/* --- 12. bot check placeholder (always passes for now) ------------------------------ */}
      <BotCheck onPass={setBotToken} />

      {error && <p className="error-text">{error}</p>}
      {uploading && <p className="muted">Uploading…</p>}

      {/* --- 13. THE post button ---------------------------------------------------------- */}
      <button className="btn btn-primary btn-big" onClick={submit} disabled={saving || uploading || !botToken}>
        {saving ? "Saving…" : editId ? "💾 Save (new version)" : "🚀 Post it"}
      </button>

      {editId && (
        <p style={{ marginTop: 24 }}>
          <button className="btn btn-danger" onClick={deletePost}>🗑 Delete this post</button>
        </p>
      )}
    </div>
  );
}
