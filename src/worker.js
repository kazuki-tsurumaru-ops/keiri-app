import { categorize, parseStatement, payeeHash, EXP_CATS, UNK_CATS } from "./ledger.js";

const SESSION_DAYS = 30;
const COOKIE = "kr_session";
const STATE_COOKIE = "kr_state";
const FY_START_YEAR = 2022; // 第1期 = 2023年7月〜2024年6月

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/auth/")) return await handleAuth(request, env, url);
      if (url.pathname.startsWith("/api/agent/")) return await handleAgent(request, env, url);
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      return json({ error: "サーバーでエラーが起きました" }, 500);
    }
  },
};

/* ---------- 共通 ---------- */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookie(name, value, maxAge, secure) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function randomId(bytes = 12) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isLocal(url) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function emailAllowed(env, email) {
  const list = (env.ALLOWED_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true;
  const e = email.toLowerCase();
  return list.some((rule) => (rule.startsWith("@") ? e.endsWith(rule) : e === rule));
}

function todayJST() {
  return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
}

function endOfNextMonth(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m + 1, 0)); // 翌月の末日
  return d.toISOString().slice(0, 10);
}

function fyOf(ym) {
  const [y, m] = ym.split("-").map(Number);
  return (m >= 7 ? y : y - 1) - FY_START_YEAR;
}

function fyMonths(fy) {
  const y0 = FY_START_YEAR + fy;
  const out = [];
  for (let i = 0; i < 12; i++) {
    const y = y0 + Math.floor((6 + i) / 12);
    const m = ((6 + i) % 12) + 1;
    out.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return out;
}

function toInt(v) {
  const n = Math.round(Number(String(v ?? "").replace(/[,，円\s]/g, "")));
  return Number.isFinite(n) ? n : 0;
}

async function getSettings(env) {
  const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
  const s = {};
  for (const r of results) s[r.key] = r.value;
  return s;
}

async function setSetting(env, key, value) {
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, String(value)).run();
}

/* ---------- ログイン ---------- */

async function currentUser(request, env) {
  const sid = getCookie(request, COOKIE);
  if (!sid) return null;
  return env.DB.prepare(
    "SELECT u.email, u.name, u.picture FROM sessions s JOIN users u ON u.email = s.email WHERE s.id = ? AND s.expires_at > ?"
  ).bind(sid, Date.now()).first();
}

async function startSession(env, url, profile) {
  await env.DB.prepare(
    "INSERT INTO users (email, name, picture, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, picture = excluded.picture"
  ).bind(profile.email, profile.name || "", profile.picture || "", Date.now()).run();
  const sid = randomId(24);
  await env.DB.prepare("INSERT INTO sessions (id, email, expires_at) VALUES (?, ?, ?)")
    .bind(sid, profile.email, Date.now() + SESSION_DAYS * 86400000).run();
  const headers = new Headers({ location: "/" });
  headers.append("set-cookie", cookie(COOKIE, sid, SESSION_DAYS * 86400, !isLocal(url)));
  headers.append("set-cookie", cookie(STATE_COOKIE, "", 0, !isLocal(url)));
  return new Response(null, { status: 302, headers });
}

async function handleAuth(request, env, url) {
  const redirectUri = `${url.origin}/auth/callback`;

  if (url.pathname === "/auth/login") {
    if (!env.GOOGLE_CLIENT_ID) return new Response("Google ログインの設定がまだです", { status: 503 });
    const state = randomId(16);
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return new Response(null, {
      status: 302,
      headers: {
        location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        "set-cookie": cookie(STATE_COOKIE, state, 600, !isLocal(url)),
      },
    });
  }

  if (url.pathname === "/auth/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || state !== getCookie(request, STATE_COOKIE)) {
      return Response.redirect(`${url.origin}/?error=state`, 302);
    }
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return Response.redirect(`${url.origin}/?error=token`, 302);
    const { access_token } = await tokenRes.json();
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) return Response.redirect(`${url.origin}/?error=userinfo`, 302);
    const profile = await infoRes.json();
    if (!profile.email || !profile.email_verified) return Response.redirect(`${url.origin}/?error=email`, 302);
    if (!emailAllowed(env, profile.email)) return Response.redirect(`${url.origin}/?error=denied`, 302);
    return startSession(env, url, profile);
  }

  // 手元の開発環境でだけ使える確認用ログイン（.dev.vars で DEV_LOGIN=1 のときのみ）
  if (url.pathname === "/auth/dev") {
    if (env.DEV_LOGIN !== "1" || !isLocal(url)) return new Response("Not found", { status: 404 });
    return startSession(env, url, { email: "dev@localhost", name: "開発用", picture: "" });
  }

  if (url.pathname === "/auth/logout" && request.method === "POST") {
    const sid = getCookie(request, COOKIE);
    if (sid) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
    return json({ ok: true }, 200, { "set-cookie": cookie(COOKIE, "", 0, !isLocal(url)) });
  }

  return new Response("Not found", { status: 404 });
}

/* ---------- Mac 側の仕組み（INVOY・Gmail を動かす Claude）とのやり取り ---------- */
// Authorization: Bearer <AGENT_TOKEN>。AGENT_TOKEN を secret に入れていなければ使えない

async function handleAgent(request, env, url) {
  const auth = request.headers.get("authorization") || "";
  if (!env.AGENT_TOKEN || auth !== `Bearer ${env.AGENT_TOKEN}`) return json({ error: "unauthorized" }, 401);
  const parts = url.pathname.split("/").filter(Boolean); // api, agent, ...

  if (parts[2] === "requests" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM invoices WHERE status = 'requested' ORDER BY created_at").all();
    return json({ items: results });
  }
  if (parts[2] === "invoices" && parts[3] && request.method === "PUT") {
    return updateInvoice(env, parts[3], await request.json());
  }
  if (parts[2] === "vendors" && request.method === "POST") {
    return createVendor(env, await request.json());
  }
  if (parts[2] === "summary" && request.method === "POST") {
    return importSummary(env, await request.json());
  }
  return json({ error: "not found" }, 404);
}

/* ---------- API ---------- */

async function handleApi(request, env, url) {
  const user = await currentUser(request, env);
  if (url.pathname === "/api/me") return json({ user, ai: !!env.AI });
  if (!user) return json({ error: "ログインが必要です" }, 401);

  const parts = url.pathname.split("/").filter(Boolean);
  const method = request.method;
  const body = method === "POST" || method === "PUT" ? await request.json().catch(() => ({})) : null;

  switch (parts[1]) {
    case "dashboard":
      return json(await dashboard(env, url.searchParams.get("fy")));

    case "invoices":
      if (parts.length === 2 && method === "GET") return listInvoices(env, url);
      if (parts.length === 2 && method === "POST") return createInvoice(env, user, body);
      if (parts.length === 3 && method === "PUT") return updateInvoice(env, parts[2], body);
      if (parts.length === 3 && method === "DELETE") {
        await env.DB.prepare("DELETE FROM invoices WHERE id = ? AND status = 'requested'").bind(parts[2]).run();
        return json({ ok: true });
      }
      break;

    case "vendors":
      if (method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM vendor_bills ORDER BY ym DESC, created_at DESC LIMIT 500").all();
        return json({ items: results });
      }
      if (method === "POST") return createVendor(env, body);
      if (method === "DELETE" && parts[2]) {
        await env.DB.prepare("DELETE FROM vendor_bills WHERE id = ?").bind(parts[2]).run();
        return json({ ok: true });
      }
      break;

    case "transactions":
      if (method === "GET") return listTransactions(env, url);
      if (method === "PUT" && parts[2]) return updateTransaction(env, parts[2], body);
      break;

    case "payments":
      return json(await paymentCandidates(env));

    case "import":
      if (parts[2] === "csv" && method === "POST") return importCsv(env, body);
      if (parts[2] === "summary" && method === "POST") return importSummary(env, body);
      if (parts[2] === "rules" && method === "POST") return importRules(env, body);
      break;

    case "settings":
      if (method === "GET") {
        const s = await getSettings(env);
        const counts = await env.DB.prepare(
          "SELECT (SELECT COUNT(*) FROM merchant_rules) AS merchants, (SELECT COUNT(*) FROM bank_rules) AS bank, (SELECT COUNT(*) FROM transactions) AS tx, (SELECT COUNT(*) FROM monthly) AS months"
        ).first();
        return json({ settings: s, counts, categories: EXP_CATS });
      }
      if (method === "PUT") {
        for (const k of ["target_sales", "target_fy", "owner_member"]) if (body[k] !== undefined) await setSetting(env, k, body[k]);
        return json({ ok: true });
      }
      break;

    case "ai":
      if (parts[2] === "parse-invoice") return json(await parseInvoiceRequest(env, String(body.text || "")));
      if (parts[2] === "suggest") return suggestCategories(env);
      if (parts[2] === "ask") return askAi(env, String(body.question || ""), body.fy);
      break;
  }
  return json({ error: "見つかりません" }, 404);
}

/* ---------- ダッシュボード ---------- */
// 月ごとに、取り込んだ集計（monthly）があればそれを使い、無い月だけアプリに入った請求書・外注・明細から数える

async function dashboard(env, fyParam) {
  const settings = await getSettings(env);
  const today = todayJST();
  const thisFy = fyOf(today.slice(0, 7));
  const fy = Number(fyParam) || thisFy;
  const months = fyMonths(fy);
  const prevMonths = fyMonths(fy - 1);
  const all = [...prevMonths, ...months];

  const imported = {};
  const { results: mrows } = await env.DB.prepare(
    `SELECT * FROM monthly WHERE ym BETWEEN ? AND ?`
  ).bind(all[0], all[all.length - 1]).all();
  for (const r of mrows) imported[r.ym] = r;

  const live = Object.fromEntries(all.map((ym) => [ym, { sales: 0, sales_n: 0, out: 0, out_n: 0, exp: {}, exp_unk: 0, hasSales: false, hasOut: false, hasExp: false }]));
  const { results: inv } = await env.DB.prepare(
    `SELECT substr(issue_date,1,7) AS ym, SUM(amount) AS s, COUNT(*) AS n FROM invoices WHERE status NOT IN ('requested','canceled') AND issue_date >= ? GROUP BY ym`
  ).bind(`${all[0]}-01`).all();
  for (const r of inv) if (live[r.ym]) Object.assign(live[r.ym], { sales: r.s, sales_n: r.n, hasSales: true });
  const { results: ven } = await env.DB.prepare(
    `SELECT ym, SUM(amount) AS s, COUNT(*) AS n FROM vendor_bills WHERE ym >= ? GROUP BY ym`
  ).bind(all[0]).all();
  for (const r of ven) if (live[r.ym]) Object.assign(live[r.ym], { out: r.s, out_n: r.n, hasOut: true });
  const { results: tx } = await env.DB.prepare(
    // ATM で口座に戻した現金は、同じ月の現金払いの経費から差し引く
    `SELECT ym, category, SUM(CASE WHEN src = '03' AND category = '現金払いの経費（明細なし）' THEN amount - inflow ELSE amount + fee END) AS s FROM transactions WHERE ym >= ? AND category != '' GROUP BY ym, category`
  ).bind(all[0]).all();
  for (const r of tx) {
    const m = live[r.ym];
    if (!m) continue;
    m.hasExp = true;
    if (EXP_CATS.includes(r.category)) m.exp[r.category] = Math.round((m.exp[r.category] || 0) + r.s);
    else if (UNK_CATS.includes(r.category)) m.exp_unk += Math.round(r.s);
  }

  const row = (ym) => {
    const im = imported[ym];
    const lv = live[ym];
    const exp = im && im.exp !== "{}" ? JSON.parse(im.exp) : lv.hasExp ? lv.exp : null;
    const r = {
      ym,
      sales: im?.sales ?? (lv.hasSales ? lv.sales : null),
      sales_n: im?.sales_n ?? (lv.hasSales ? lv.sales_n : null),
      out: im?.out ?? (lv.hasOut ? lv.out : null),
      out_n: im?.out_n ?? (lv.hasOut ? lv.out_n : null),
      exp,
      exp_total: exp ? Object.values(exp).reduce((a, b) => a + b, 0) : null,
      exp_unk: im && im.exp !== "{}" ? im.exp_unk : lv.exp_unk,
      source: im ? "import" : lv.hasSales || lv.hasOut || lv.hasExp ? "app" : "none",
    };
    return r;
  };
  const rows = months.map(row);
  const prev = prevMonths.map(row);

  const sum = (arr, k) => arr.reduce((a, r) => a + (r[k] || 0), 0);
  const totals = { sales: sum(rows, "sales"), out: sum(rows, "out"), exp: sum(rows, "exp_total") };
  totals.profit = totals.sales - totals.out - totals.exp;
  const prevTotals = { sales: sum(prev, "sales"), out: sum(prev, "out"), exp: sum(prev, "exp_total") };

  const catTotals = {};
  for (const r of rows) for (const [c, v] of Object.entries(r.exp || {})) catTotals[c] = (catTotals[c] || 0) + v;

  const att = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM invoices WHERE status = 'requested') AS requested,
      (SELECT COUNT(*) FROM invoices WHERE status IN ('draft','ready')) AS to_send,
      (SELECT COUNT(*) FROM invoices WHERE status = 'sent') AS unpaid,
      (SELECT COALESCE(SUM(total),0) FROM invoices WHERE status = 'sent') AS unpaid_total,
      (SELECT COUNT(*) FROM invoices WHERE status = 'sent' AND due_date != '' AND due_date < ?) AS overdue,
      (SELECT COUNT(*) FROM transactions WHERE category IN ('要確認','')) AS uncategorized`
  ).bind(today).first();

  const lastData = [...mrows.map((r) => r.ym)].sort().pop() || null;
  const targetFy = Number(settings.target_fy || 0);
  return {
    fy,
    thisFy,
    today,
    fyRange: [months[0], months[11]],
    target: targetFy === fy ? Number(settings.target_sales || 0) : 0,
    months: rows,
    prevMonths: prev,
    totals,
    prevTotals,
    catTotals,
    attention: att,
    importedUntil: lastData,
    importedAsof: settings.summary_asof || null,
    dataVersion: settings.summary_version || null,
  };
}

/* ---------- 請求書 ---------- */

async function listInvoices(env, url) {
  const status = url.searchParams.get("status");
  const q = status
    ? env.DB.prepare("SELECT * FROM invoices WHERE status = ? ORDER BY issue_date DESC, created_at DESC LIMIT 300").bind(status)
    : env.DB.prepare("SELECT * FROM invoices ORDER BY CASE status WHEN 'requested' THEN 0 WHEN 'draft' THEN 1 WHEN 'ready' THEN 2 ELSE 3 END, issue_date DESC, created_at DESC LIMIT 300");
  const { results } = await q.all();
  const { results: clients } = await env.DB.prepare(
    "SELECT client, MAX(send_via) AS send_via, COUNT(*) AS n FROM invoices GROUP BY client ORDER BY n DESC LIMIT 50"
  ).all();
  return json({ items: results, clients });
}

function calcInvoice(b) {
  const amount = toInt(b.amount);
  const tax = b.tax !== undefined && b.tax !== "" ? toInt(b.tax) : Math.floor(amount * 0.1);
  // 源泉徴収（個人あて）: 100万円以下は10.21%、超える部分は20.42%
  let withholding = 0;
  if (b.withholding === true || b.withholding === 1 || b.withholding === "1") {
    withholding = amount <= 1000000 ? Math.floor(amount * 0.1021) : Math.floor(102100 + (amount - 1000000) * 0.2042);
  } else if (typeof b.withholding === "number" && b.withholding > 1) withholding = b.withholding;
  return { amount, tax, withholding, total: amount + tax - withholding };
}

async function createInvoice(env, user, b) {
  if (!b.client || !toInt(b.amount)) return json({ error: "宛先と金額を入れてください" }, 400);
  const now = Date.now();
  const issue = /^\d{4}-\d{2}-\d{2}$/.test(b.issue_date || "") ? b.issue_date : todayJST();
  const c = calcInvoice(b);
  const id = randomId(8);
  await env.DB.prepare(
    `INSERT INTO invoices (id, number, client, title, amount, tax, withholding, total, issue_date, due_date, status, send_via, drive_url, request_text, note, created_by, created_at, updated_at)
     VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?, '', ?, ?, ?, ?, ?)`
  ).bind(
    id, String(b.client).slice(0, 120), String(b.title || "").slice(0, 200), c.amount, c.tax, c.withholding, c.total,
    issue, /^\d{4}-\d{2}-\d{2}$/.test(b.due_date || "") ? b.due_date : endOfNextMonth(issue),
    b.send_via === "line" ? "line" : "mail", String(b.request_text || "").slice(0, 500), String(b.note || "").slice(0, 1000),
    user.email, now, now
  ).run();
  return json({ item: await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first() }, 201);
}

const INVOICE_STATUSES = ["requested", "draft", "ready", "sent", "paid", "canceled"];

async function updateInvoice(env, id, b) {
  const cur = await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first();
  if (!cur) return json({ error: "見つかりません" }, 404);
  const next = { ...cur };
  for (const k of ["number", "client", "title", "issue_date", "due_date", "drive_url", "note", "paid_date"]) {
    if (b[k] !== undefined) next[k] = String(b[k]).slice(0, 1000);
  }
  if (b.send_via !== undefined) next.send_via = b.send_via === "line" ? "line" : "mail";
  if (b.status !== undefined && INVOICE_STATUSES.includes(b.status)) next.status = b.status;
  if (next.status === "paid" && !next.paid_date) next.paid_date = todayJST();
  if (next.status !== "paid") next.paid_date = b.paid_date !== undefined ? next.paid_date : "";
  if (b.amount !== undefined || b.tax !== undefined || b.withholding !== undefined) {
    Object.assign(next, calcInvoice({
      amount: b.amount ?? cur.amount,
      tax: b.tax ?? (b.amount !== undefined ? undefined : cur.tax),
      withholding: b.withholding ?? cur.withholding,
    }));
  }
  await env.DB.prepare(
    `UPDATE invoices SET number=?, client=?, title=?, amount=?, tax=?, withholding=?, total=?, issue_date=?, due_date=?, status=?, send_via=?, drive_url=?, note=?, paid_date=?, updated_at=? WHERE id=?`
  ).bind(next.number, next.client, next.title, next.amount, next.tax, next.withholding, next.total, next.issue_date, next.due_date,
    next.status, next.send_via, next.drive_url, next.note, next.paid_date, Date.now(), id).run();
  return json({ item: await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first() });
}

/* ---------- 外注の請求書 ---------- */

async function createVendor(env, b) {
  if (!b.vendor || !/^\d{4}-\d{2}$/.test(b.ym || "")) return json({ error: "外注先と何月分かを入れてください" }, 400);
  const id = randomId(8);
  await env.DB.prepare("INSERT INTO vendor_bills (id, vendor, ym, amount, drive_url, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, String(b.vendor).slice(0, 120), b.ym, toInt(b.amount), String(b.drive_url || ""), String(b.note || ""), Date.now()).run();
  return json({ item: await env.DB.prepare("SELECT * FROM vendor_bills WHERE id = ?").bind(id).first() }, 201);
}

/* ---------- 明細 ---------- */

async function listTransactions(env, url) {
  const ym = url.searchParams.get("ym");
  const src = url.searchParams.get("src");
  const cat = url.searchParams.get("cat");
  const where = [];
  const args = [];
  if (ym) { where.push("ym = ?"); args.push(ym); }
  if (src) { where.push("src = ?"); args.push(src); }
  if (cat === "_unknown") where.push("category IN ('要確認','')");
  else if (cat) { where.push("category = ?"); args.push(cat); }
  const sql = `SELECT * FROM transactions ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY date DESC, id LIMIT 400`;
  const { results } = await env.DB.prepare(sql).bind(...args).all();
  const { results: months } = await env.DB.prepare("SELECT ym, COUNT(*) AS n FROM transactions GROUP BY ym ORDER BY ym DESC").all();
  return json({ items: results, months, categories: [...EXP_CATS, ...UNK_CATS] });
}

async function updateTransaction(env, id, b) {
  const t = await env.DB.prepare("SELECT * FROM transactions WHERE id = ?").bind(id).first();
  if (!t) return json({ error: "見つかりません" }, 404);
  const cat = String(b.category || "");
  await env.DB.prepare("UPDATE transactions SET category = ?, manual = 1 WHERE id = ?").bind(cat, id).run();
  let applied = 1;
  // 「この利用先はいつもこの科目」: 科目表に足し、同じ利用先のまだ決まっていない行にも当てる
  if (b.remember && t.rule_key && t.src !== "03") {
    await env.DB.prepare("INSERT INTO merchant_rules (key, category, personal02, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT(key) DO UPDATE SET category = excluded.category, updated_at = excluded.updated_at")
      .bind(t.rule_key, cat, Date.now()).run();
    const r = await env.DB.prepare("UPDATE transactions SET category = ? WHERE rule_key = ? AND manual = 0 AND src != '03' AND category IN ('要確認','')")
      .bind(cat, t.rule_key).run();
    applied += r.meta?.changes || 0;
  }
  return json({ ok: true, applied });
}

async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadRules(env) {
  const { results: m } = await env.DB.prepare("SELECT key, category, personal02 FROM merchant_rules").all();
  const merchants = new Map(m.map((r) => [r.key, [r.category, !!r.personal02]]));
  const { results: bank } = await env.DB.prepare("SELECT pattern, category FROM bank_rules ORDER BY ord").all();
  const s = await getSettings(env);
  return { merchants, bank, owner: s.owner_member || "" };
}

async function importCsv(env, b) {
  const src = String(b.src || "");
  if (!["01", "02", "03", "04"].includes(src)) return json({ error: "明細の種類を選んでください" }, 400);
  const rows = parseStatement(src, String(b.text || ""));
  if (!rows.length) return json({ error: "明細の行が読めませんでした。種類が合っているか確かめてください" }, 400);
  const rules = await loadRules(env);
  const seen = new Map();
  const stmts = [];
  let unknown = 0;
  const now = Date.now();
  for (const r of rows) {
    const base = [src, r.date, r.descr, r.member, r.amount, r.inflow].join("|");
    const n = (seen.get(base) || 0) + 1; // 同じファイル内の同じ行は別の行として数える
    seen.set(base, n);
    const id = await sha(`${base}|${n}`);
    if (src === "03") r.payee = await payeeHash(r.descr);
    const { category, key } = categorize(src, r, rules);
    if (category === null) continue; // カードの支払いなど、数えない行
    if (category === "要確認") unknown++;
    stmts.push(env.DB.prepare(
      `INSERT INTO transactions (id, src, date, ym, descr, member, amount, inflow, fee, rule_key, category, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`
    ).bind(id, src, r.date, r.date.slice(0, 7), r.descr, r.member, r.amount, r.inflow, r.fee, key, category, now));
  }
  let added = 0;
  for (let i = 0; i < stmts.length; i += 80) {
    const res = await env.DB.batch(stmts.slice(i, i + 80));
    added += res.reduce((a, x) => a + (x.meta?.changes || 0), 0);
  }
  return json({ ok: true, read: rows.length, added, skipped: stmts.length - added, unknown });
}

async function importSummary(env, d) {
  if (!d || !Array.isArray(d.months)) return json({ error: "売上ダッシュボードの数字（data.json）の形ではありません" }, 400);
  const now = Date.now();
  const stmts = d.months.filter((m) => /^\d{4}-\d{2}$/.test(m.ym)).map((m) =>
    env.DB.prepare(
      `INSERT INTO monthly (ym, sales, sales_n, out, out_n, exp, exp_unk, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(ym) DO UPDATE SET sales=excluded.sales, sales_n=excluded.sales_n, out=excluded.out, out_n=excluded.out_n, exp=excluded.exp, exp_unk=excluded.exp_unk, updated_at=excluded.updated_at`
    ).bind(m.ym, m.sales ?? null, m.sales_n ?? null, m.out ?? null, m.out_n ?? null, JSON.stringify(m.exp || {}), toInt(m.exp_unk), now)
  );
  for (let i = 0; i < stmts.length; i += 80) await env.DB.batch(stmts.slice(i, i + 80));
  if (d.target?.fy && d.target?.sales) {
    await setSetting(env, "target_fy", d.target.fy);
    await setSetting(env, "target_sales", d.target.sales);
  }
  if (d.asof) await setSetting(env, "summary_asof", d.asof);
  if (d.data_version) await setSetting(env, "summary_version", d.data_version);
  return json({ ok: true, months: stmts.length, asof: d.asof || null, version: d.data_version || null });
}

async function importRules(env, b) {
  const now = Date.now();
  let merchants = 0;
  let bank = 0;
  if (b.merchant_map && typeof b.merchant_map === "object") {
    const stmts = Object.entries(b.merchant_map).map(([k, v]) =>
      env.DB.prepare("INSERT INTO merchant_rules (key, category, personal02, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET category=excluded.category, personal02=excluded.personal02, updated_at=excluded.updated_at")
        .bind(k, String(Array.isArray(v) ? v[0] : v), Array.isArray(v) && v[1] ? 1 : 0, now)
    );
    for (let i = 0; i < stmts.length; i += 80) await env.DB.batch(stmts.slice(i, i + 80));
    merchants = stmts.length;
  }
  if (Array.isArray(b.bank_rules)) {
    await env.DB.prepare("DELETE FROM bank_rules").run();
    const stmts = b.bank_rules.map((r, i) => env.DB.prepare("INSERT INTO bank_rules (ord, pattern, category) VALUES (?, ?, ?)").bind(i, String(r[0]), r[1] ?? null));
    if (stmts.length) await env.DB.batch(stmts);
    bank = stmts.length;
  }
  if (b.owner_member) await setSetting(env, "owner_member", b.owner_member);
  // 新しいルールで、まだ決まっていない行を振り分け直す
  const rules = await loadRules(env);
  const { results } = await env.DB.prepare("SELECT * FROM transactions WHERE manual = 0").all();
  const ups = [];
  for (const t of results) {
    if (t.src === "03") t.payee = await payeeHash(t.descr);
    const { category } = categorize(t.src, t, rules);
    if (category !== null && category !== t.category) ups.push(env.DB.prepare("UPDATE transactions SET category = ? WHERE id = ?").bind(category, t.id));
  }
  for (let i = 0; i < ups.length; i += 80) await env.DB.batch(ups.slice(i, i + 80));
  return json({ ok: true, merchants, bank, recategorized: ups.length });
}

/* ---------- 入金の照合 ---------- */
// 口座の入金と、請求済みの請求額が同じものを候補に出す

async function paymentCandidates(env) {
  const { results: unpaid } = await env.DB.prepare("SELECT id, client, title, total, issue_date, due_date FROM invoices WHERE status = 'sent'").all();
  if (!unpaid.length) return { items: [] };
  const { results: inflows } = await env.DB.prepare("SELECT id, date, descr, inflow FROM transactions WHERE src = '03' AND inflow > 0 ORDER BY date DESC LIMIT 600").all();
  const items = [];
  for (const inv of unpaid) {
    const hit = inflows.find((t) => Math.round(t.inflow) === inv.total && t.date >= inv.issue_date);
    if (hit) items.push({ invoice: inv, tx: hit });
  }
  return { items };
}

/* ---------- AI（Workers AI） ---------- */

async function runAi(env, messages, maxTokens = 700) {
  if (!env.AI) return null;
  const res = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages, max_tokens: maxTokens, temperature: 0.2 });
  const r = res?.response ?? res;
  return typeof r === "string" ? r : JSON.stringify(r);
}

function extractJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/[\[{][\s\S]*[\]}]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// 「株式会社ABCに25万円の請求書」を読む。AI が使えないときも、よくある書き方はここで読む
export function parseInvoiceRule(text, today) {
  const t = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  const out = { client: "", title: "", amount: 0, tax_included: false, withholding: false, issue_date: today, due_date: "" };
  const cm = t.match(/^(.+?)(?:様|さん|御中)?(?:に|へ|宛て?で?|あて)/);
  if (cm) out.client = cm[1].replace(/(様|さん|御中)$/, "").trim();
  const am = t.match(/([\d.,]+)\s*(万|千)?\s*円?/);
  if (am) {
    let n = Number(am[1].replace(/,/g, ""));
    if (am[2] === "万") n *= 10000;
    if (am[2] === "千") n *= 1000;
    out.amount = Math.round(n);
  }
  if (/税込/.test(t)) out.tax_included = true;
  if (/源泉/.test(t)) out.withholding = true;
  const tm = t.match(/[「『](.+?)[」』]/) || t.match(/件名(?:は|:)?\s*(.+?)(?:で|、|$)/);
  if (tm) out.title = tm[1].trim();
  const mm = t.match(/(\d{1,2})\s*月(?:度|分)/);
  if (mm && !out.title) out.title = `${Number(mm[1])}月度`;
  return out;
}

async function parseInvoiceRequest(env, text) {
  const today = todayJST();
  let parsed = parseInvoiceRule(text, today);
  let via = "rule";
  const ai = await runAi(env, [
    {
      role: "system",
      content:
        `あなたは日本の請求書の依頼文を読み取る係です。今日は ${today}。次の JSON だけを返してください。説明は不要。\n` +
        `{"client":"宛先の会社名・氏名（敬称なし）","title":"件名（書かれていなければ空）","amount":税抜の金額の数値,"tax_included":金額が税込なら true,"withholding":源泉徴収が必要と書かれていれば true,"issue_date":"YYYY-MM-DD（書かれていなければ今日）","due_date":"YYYY-MM-DD（書かれていなければ空）"}\n` +
        `「25万円」は 250000。「税込」と書かれていなければ税抜とみなす。`,
    },
    { role: "user", content: text },
  ], 300).catch(() => null);
  const j = extractJson(ai);
  if (j && (j.client || j.amount)) {
    parsed = { ...parsed, ...Object.fromEntries(Object.entries(j).filter(([, v]) => v !== "" && v !== null && v !== undefined)) };
    via = "ai";
  }
  parsed.amount = toInt(parsed.amount);
  if (parsed.tax_included) parsed.amount = Math.round(parsed.amount / 1.1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.issue_date || "")) parsed.issue_date = today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.due_date || "")) parsed.due_date = endOfNextMonth(parsed.issue_date);
  // 過去に出した宛先と近ければ、その書き方にそろえる
  if (parsed.client) {
    const { results } = await env.DB.prepare("SELECT DISTINCT client, send_via FROM invoices").all();
    const norm = (s) => s.normalize("NFKC").replace(/株式会社|\(株\)|㈱|合同会社|有限会社|\s/g, "").toLowerCase();
    const hit = results.find((r) => norm(r.client) === norm(parsed.client));
    if (hit) { parsed.client = hit.client; parsed.send_via = hit.send_via; }
  }
  return { ...parsed, via };
}

async function suggestCategories(env) {
  const { results } = await env.DB.prepare(
    "SELECT rule_key, MAX(descr) AS descr, COUNT(*) AS n, SUM(amount) AS total FROM transactions WHERE category IN ('要確認','') AND src != '03' AND rule_key != '' GROUP BY rule_key ORDER BY total DESC LIMIT 25"
  ).all();
  if (!results.length) return json({ items: [] });
  if (!env.AI) return json({ items: [], error: "AI がつながっていません（手元の確認環境では使えません）" });
  const ai = await runAi(env, [
    {
      role: "system",
      content:
        `あなたは日本の映像制作会社の経理担当です。カードの利用先の名前から、勘定科目を次の中から1つ選びます: ${EXP_CATS.join("、")}、私用。\n` +
        `JSON 配列だけを返してください: [{"key":"利用先","category":"科目","reason":"10字程度の理由"}]`,
    },
    { role: "user", content: results.map((r) => `${r.rule_key}（${Math.round(r.total)}円・${r.n}件）`).join("\n") },
  ], 1200).catch(() => null);
  const arr = extractJson(ai);
  const items = [];
  if (Array.isArray(arr)) {
    for (const s of arr) {
      if (!s?.key || ![...EXP_CATS, "私用"].includes(s.category)) continue;
      items.push({ key: s.key, category: s.category, reason: String(s.reason || "").slice(0, 40) });
      await env.DB.prepare("UPDATE transactions SET ai_suggest = ? WHERE rule_key = ? AND category IN ('要確認','')").bind(s.category, s.key).run();
    }
  }
  return json({ items });
}

async function askAi(env, question, fyParam) {
  if (!question.trim()) return json({ error: "質問を入れてください" }, 400);
  if (!env.AI) return json({ answer: "AI がつながっていません（手元の確認環境では使えません）。", offline: true });
  const d = await dashboard(env, fyParam);
  const ym = (s) => `${Number(s.slice(0, 4))}年${Number(s.slice(5))}月`;
  const lines = d.months.filter((m) => m.source !== "none").map((m) =>
    `${ym(m.ym)}: 売上${m.sales ?? "-"} 外注費${m.out ?? "-"} 経費${m.exp_total ?? "-"}`);
  const cats = Object.entries(d.catTotals).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, v]) => `${c}${v}`);
  const { results: clients } = await env.DB.prepare(
    "SELECT client, SUM(amount) AS s, COUNT(*) AS n FROM invoices WHERE status NOT IN ('requested','canceled') AND issue_date BETWEEN ? AND ? GROUP BY client ORDER BY s DESC LIMIT 10"
  ).bind(`${d.fyRange[0]}-01`, `${d.fyRange[1]}-31`).all();
  const ctx = [
    `対象: 第${d.fy}期（${ym(d.fyRange[0])}〜${ym(d.fyRange[1])}）。今日は ${d.today}。金額は円・税抜。`,
    `期の合計: 売上${d.totals.sales} 外注費${d.totals.out} 経費${d.totals.exp} 残り${d.totals.profit}。前の期: 売上${d.prevTotals.sales} 外注費${d.prevTotals.out} 経費${d.prevTotals.exp}`,
    d.target ? `売上目標: ${d.target}` : "売上目標: 未設定",
    `月ごと:\n${lines.join("\n")}`,
    `経費の科目（期の合計・上位）: ${cats.join("、") || "なし"}`,
    `未入金の請求書: ${d.attention.unpaid}件 ${d.attention.unpaid_total}円（期限切れ ${d.attention.overdue}件）`,
    clients.length ? `アプリに入っている請求書の取引先別（期）: ${clients.map((c) => `${c.client}${c.s}円${c.n}件`).join("、")}` : "",
  ].filter(Boolean).join("\n");
  const answer = await runAi(env, [
    {
      role: "system",
      content:
        "あなたは小さな映像制作会社の経営者を支える経理の相談相手です。与えられた数字だけを根拠に、日本語で短く答えます。" +
        "結論を最初の1文に書き、続けて根拠の数字を2〜4行の箇条書きで示します。数字は「1,234,567円」や「123万円」の形で書きます。" +
        "数字に無いことは推測せず「データにありません」と書きます。投資や税務の判断を断定しません。",
    },
    { role: "user", content: `${ctx}\n\n質問: ${question}` },
  ], 700).catch(() => null);
  return json({ answer: answer || "答えを作れませんでした。もう一度お試しください。" });
}
