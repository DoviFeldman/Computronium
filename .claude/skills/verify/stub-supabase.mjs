// Minimal in-memory PostgREST/Supabase-storage stub — just enough for
// supabase-js as used by Computronium's API routes. Logs every request.
import http from "node:http";
import { randomUUID } from "node:crypto";

const tables = {
  profiles: [],
  posts: [
    {
      id: randomUUID(),
      owner_id: null,
      name: "Line Follower Bot",
      description: "A working line follower.",
      answers: {},
      instructions: null,
      code_text: null,
      video_url: null,
      difficulty: "green",
      advanced: false,
      attempted: false,
      price_estimate: 20,
      fork_of: null,
      fork_count: 0,
      alternatives_category: null,
      alternatives_rank: null,
      pinned: false,
      upvotes: 3,
      views: 10,
      current_version: 1,
      created_at: new Date(Date.now() - 3600e3).toISOString(),
    },
    {
      id: randomUUID(),
      owner_id: null,
      name: "Hoverboard That Never Hovered",
      description: "Tried magnets. Physics won.",
      answers: {},
      instructions: null,
      code_text: null,
      video_url: null,
      difficulty: "yellow",
      advanced: false,
      attempted: true,
      price_estimate: 80,
      fork_of: null,
      fork_count: 0,
      alternatives_category: null,
      alternatives_rank: null,
      pinned: false,
      upvotes: 1,
      views: 5,
      current_version: 1,
      created_at: new Date(Date.now() - 7200e3).toISOString(),
    },
  ],
  post_versions: [],
  post_hardware: [],
  post_files: [],
  questions: [],
  question_replies: [],
};

const storage = new Map(); // path -> {bytes, type}

function embed(table, row) {
  const r = { ...row };
  if (table === "questions") {
    r.owner = null;
    r.question_replies = [
      { count: tables.question_replies.filter((x) => x.question_id === row.id).length },
    ];
  }
  if (table === "question_replies") r.owner = null;
  if (table === "posts") {
    r.owner = null;
    r.post_hardware = tables.post_hardware.filter((h) => h.post_id === row.id);
    r.post_files = tables.post_files.filter((f) => f.post_id === row.id);
  }
  return r;
}

function applyFilters(rows, params) {
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset"].includes(key)) continue;
    const m = /^eq\.(.*)$/.exec(value);
    if (!m) continue;
    let v = m[1];
    if (v === "true") v = true;
    else if (v === "false") v = false;
    rows = rows.filter((r) => r[key] === v);
  }
  const order = params.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    rows = [...rows].sort((a, b) =>
      (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === "desc" ? -1 : 1)
    );
  }
  const limit = params.get("limit");
  if (limit) rows = rows.slice(0, parseInt(limit, 10));
  return rows;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const bodyBuf = Buffer.concat(chunks);
  console.log(`${req.method} ${req.url} ${bodyBuf.length ? `(${bodyBuf.length}b)` : ""}`);

  // ---- storage ----
  if (url.pathname.startsWith("/storage/v1/object/")) {
    const rest = url.pathname.replace("/storage/v1/object/", "");
    if (req.method === "POST") {
      const path = rest.replace(/^computronium-files\//, "");
      storage.set(path, { bytes: bodyBuf, type: req.headers["content-type"] || "application/octet-stream" });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ Key: `computronium-files/${path}` }));
    }
    if (req.method === "GET" && rest.startsWith("public/computronium-files/")) {
      const path = rest.replace("public/computronium-files/", "");
      const f = storage.get(path);
      if (!f) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "content-type": f.type });
      return res.end(f.bytes);
    }
    if (req.method === "DELETE") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end("[]");
    }
  }

  // ---- auth (shouldn't be hit without a session, but be safe) ----
  if (url.pathname.startsWith("/auth/")) {
    res.writeHead(401, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: "no session" }));
  }

  // ---- rest ----
  const m = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
  if (!m || !tables[m[1]]) {
    res.writeHead(404, { "content-type": "application/json" });
    return res.end(JSON.stringify({ message: `unknown ${url.pathname}` }));
  }
  const table = m[1];
  const wantsObject = (req.headers.accept || "").includes("vnd.pgrst.object+json");
  const params = url.searchParams;

  if (req.method === "GET" || req.method === "HEAD") {
    const rows = applyFilters(tables[table], params).map((r) => embed(table, r));
    if (wantsObject) {
      if (rows.length === 1) {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify(rows[0]));
      }
      res.writeHead(406, { "content-type": "application/json" });
      return res.end(JSON.stringify({ code: "PGRST116", message: "0 rows", details: `Results contain ${rows.length} rows`, hint: null }));
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(rows));
  }

  if (req.method === "POST") {
    const parsed = JSON.parse(bodyBuf.toString() || "{}");
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const inserted = list.map((item) => {
      const row = { id: randomUUID(), created_at: new Date().toISOString(), ...item };
      tables[table].push(row);
      return row;
    });
    const rep = inserted.map((r) => embed(table, r));
    res.writeHead(201, { "content-type": "application/json" });
    return res.end(JSON.stringify(wantsObject ? rep[0] : rep));
  }

  if (req.method === "PATCH") {
    const patch = JSON.parse(bodyBuf.toString() || "{}");
    const targets = applyFilters(tables[table], params);
    for (const t of targets) Object.assign(t, patch);
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "DELETE") {
    const targets = new Set(applyFilters(tables[table], params).map((r) => r.id));
    tables[table] = tables[table].filter((r) => !targets.has(r.id));
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(405);
  res.end();
});

server.listen(54321, "127.0.0.1", () => console.log("stub supabase on :54321"));
