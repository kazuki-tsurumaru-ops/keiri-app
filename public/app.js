const VERSION = "0.1.0";

/* ---------- 小さな道具 ---------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const yen = (n) => (n === null || n === undefined ? "—" : `¥${Math.round(n).toLocaleString("ja-JP")}`);
const man = (n) => {
  if (n === null || n === undefined) return "—";
  const a = Math.abs(n);
  if (a >= 1e8) return `${(n / 1e8).toFixed(2)}億`;
  if (a >= 1e4) return `${(n / 1e4).toFixed(a >= 1e7 ? 0 : 1)}万`;
  return Math.round(n).toLocaleString("ja-JP");
};
const ymLabel = (ym) => `${Number(ym.slice(5))}月`;
const ymLong = (ym) => `${ym.slice(0, 4)}年${Number(ym.slice(5))}月`;
const dateLabel = (d) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : "");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDesktop = () => matchMedia("(min-width: 960px)").matches;
const haptic = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  invoice: '<path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.4z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3"/><path d="M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.4c1.7.7 2.8 2.4 3.1 5.1"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/><path d="M19 15.5c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17.2v.1"/>',
  yen: '<path d="m6 4 6 8 6-8M12 12v8M7.5 13h9M7.5 16.5h9"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4L11.6 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  google: "",
};
const icon = (name, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
const GOOGLE_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers: opts.body ? { "content-type": "application/json" } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/me") { location.href = "/"; throw new Error("ログインが必要です"); }
  if (!res.ok) throw new Error(data.error || `エラー（${res.status}）`);
  return data;
}

/* ---------- ばね（Apple の damping / response で指定する） ---------- */

function spring({ from, to, velocity = 0, damping = 1, response = 0.4, onUpdate, onDone }) {
  if (reduceMotion) { onUpdate(to); onDone?.(); return { stop() {}, get value() { return to; } }; }
  const k = (2 * Math.PI / response) ** 2;
  const c = 4 * Math.PI * damping / response;
  let x = from, v = velocity, last = performance.now(), raf = 0, stopped = false;
  const tick = (now) => {
    if (stopped) return;
    let dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      const a = -k * (x - to) - c * v;
      v += a * h; x += v * h; dt -= h;
    }
    onUpdate(x);
    if (Math.abs(v) < 0.5 && Math.abs(x - to) < 0.3) { onUpdate(to); onDone?.(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { stop() { stopped = true; cancelAnimationFrame(raf); }, get value() { return x; }, get velocity() { return v; } };
}

// 選ばれている項目の下に、ガラスの粒をばねで滑らせる
const pillState = new WeakMap();
function movePill(pill, target, vertical = false) {
  if (!pill || !target) return;
  const parent = pill.parentElement.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  const pos = vertical ? r.top - parent.top : r.left - parent.left;
  const size = vertical ? r.height : r.width;
  const st = pillState.get(pill);
  const apply = (p, s) => {
    pill.style.transform = vertical ? `translateY(${p}px)` : `translateX(${p}px)`;
    if (vertical) pill.style.height = `${s}px`; else pill.style.width = `${s}px`;
  };
  if (!st) { apply(pos, size); pillState.set(pill, { p: pos, s: size }); return; }
  st.a?.stop(); st.b?.stop();
  const cur = { p: st.p, s: st.s };
  st.a = spring({ from: cur.p, to: pos, velocity: st.a?.velocity || 0, damping: 0.78, response: 0.42, onUpdate: (v) => { st.p = v; apply(st.p, st.s); } });
  st.b = spring({ from: cur.s, to: size, damping: 0.85, response: 0.42, onUpdate: (v) => { st.s = v; apply(st.p, st.s); } });
}

// 数字を 0 から数え上げる
function countUp(el, to, fmt = (n) => Math.round(n).toLocaleString("ja-JP"), ms = 1100) {
  if (reduceMotion || !to) { el.textContent = fmt(to || 0); return; }
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(to * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function toast(msg, err = false) {
  const el = document.createElement("div");
  el.className = `toast glass strong${err ? " err" : ""}`;
  el.innerHTML = `${icon(err ? "alert" : "check")}<span>${esc(msg)}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  haptic(err ? [10, 40, 10] : 10);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 600); }, 2600);
}

/* ---------- 下から出る板（つまんで下げると閉じる） ---------- */

function openSheet({ title, html, onMount, wide }) {
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  const sheet = document.createElement("section");
  sheet.className = "sheet glass strong";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  if (wide) sheet.style.maxWidth = "760px";
  sheet.innerHTML = `
    <div class="grabber"></div>
    <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="閉じる">${icon("close")}</button></div>
    <div class="sheet-body">${html}</div>`;
  document.body.append(scrim, sheet);
  const body = $(".sheet-body", sheet);
  const desk = isDesktop();
  let y = 0, anim = null, closed = false;
  const h = () => sheet.getBoundingClientRect().height;
  const apply = (v) => {
    y = v;
    if (desk) {
      const p = Math.max(0, Math.min(1, 1 - v / 120));
      sheet.style.transform = `translateY(calc(-50% + ${v * 0.35}px)) scale(${0.94 + 0.06 * p})`;
      sheet.style.opacity = p;
    } else {
      sheet.style.transform = `translateY(${v}px)`;
    }
    scrim.style.opacity = Math.max(0, 1 - v / (desk ? 120 : h()));
  };
  const close = (velocity = 0) => {
    if (closed) return;
    closed = true;
    anim?.stop();
    document.removeEventListener("keydown", onKey);
    anim = spring({ from: y, to: desk ? 120 : h() + 20, velocity, damping: 1, response: 0.32, onUpdate: apply, onDone: () => { scrim.remove(); sheet.remove(); } });
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  apply(desk ? 120 : h() + 20);
  anim = spring({ from: y, to: 0, damping: desk ? 0.9 : 0.86, response: 0.42, onUpdate: apply });
  scrim.addEventListener("click", () => close());
  $("[data-close]", sheet).addEventListener("click", () => close());

  // つまんで動かす（スマホ）
  if (!desk) {
    let startY = 0, startSheet = 0, dragging = false, hist = [];
    const down = (e) => {
      const inBody = body.contains(e.target);
      if (inBody && body.scrollTop > 0) return;
      if (e.target.closest("input, textarea, select, button, a, .seg, .chips")) return;
      startY = e.clientY; startSheet = y; dragging = inBody ? "maybe" : true; hist = [[e.timeStamp, e.clientY]];
      anim?.stop();
      if (dragging === true) sheet.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (dragging === "maybe") {
        if (dy > 10 && body.scrollTop <= 0) { dragging = true; sheet.setPointerCapture(e.pointerId); startY = e.clientY; } else if (Math.abs(dy) > 10) { dragging = false; }
        return;
      }
      const raw = startSheet + (e.clientY - startY);
      // 上へ引っぱったときは、ゴムのように抵抗する
      apply(raw < 0 ? -((-raw * 0.55 * h()) / (h() + 0.55 * -raw)) : raw);
      hist.push([e.timeStamp, e.clientY]);
      if (hist.length > 6) hist.shift();
    };
    const up = () => {
      if (dragging !== true) { dragging = false; return; }
      dragging = false;
      const [t0, y0] = hist[0], [t1, y1] = hist[hist.length - 1];
      const v = t1 > t0 ? ((y1 - y0) / (t1 - t0)) * 1000 : 0;
      const projected = y + (v / 1000) * 0.998 / (1 - 0.998);
      if (projected > h() * 0.45 || v > 1100) close(v);
      else anim = spring({ from: y, to: 0, velocity: v, damping: 0.82, response: 0.36, onUpdate: apply });
    };
    sheet.addEventListener("pointerdown", down);
    sheet.addEventListener("pointermove", move);
    sheet.addEventListener("pointerup", up);
    sheet.addEventListener("pointercancel", up);
  }
  const api_ = { el: sheet, body, close, setTitle: (t) => { $(".sheet-head h2", sheet).textContent = t; } };
  onMount?.(api_);
  return api_;
}

/* ---------- 起動 ---------- */

const state = { user: null, ai: false, view: "home", fy: null, att: null, dash: null };
const VIEWS = [
  { id: "home", path: "/", label: "ホーム", icon: "home" },
  { id: "invoices", path: "/invoices", label: "請求書", icon: "invoice" },
  { id: "expenses", path: "/expenses", label: "明細", icon: "card" },
  { id: "vendors", path: "/vendors", label: "外注", icon: "people" },
  { id: "more", path: "/more", label: "その他", icon: "more" },
];

boot();

async function boot() {
  try {
    const me = await api("/api/me");
    state.user = me.user;
    state.ai = me.ai;
  } catch {
    state.user = null;
  }
  if (!state.user) return renderLogin();
  renderShell();
  const v = VIEWS.find((x) => x.path === location.pathname) || VIEWS[0];
  go(v.id, { replace: true, first: true, query: location.search });
  if (v.id !== "home") refreshBadges();
  addEventListener("popstate", () => {
    const pv = VIEWS.find((x) => x.path === location.pathname) || VIEWS[0];
    go(pv.id, { pop: true });
  });
  addEventListener("resize", () => updatePills());
}

function renderLogin() {
  const err = new URLSearchParams(location.search).get("error");
  const msg = { denied: "このアカウントではログインできません。会社の Google アカウントでログインしてください。", state: "ログインをやり直してください。", token: "Google との接続に失敗しました。", email: "メールアドレスを確認できませんでした。" }[err];
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  $("#app").innerHTML = `
    <div class="login">
      <div class="login-card glass strong">
        <div class="login-mark">${icon("invoice")}</div>
        <h1>REConos 経理</h1>
        <a class="google-btn" href="/auth/login">${GOOGLE_G}<span>Google でログイン</span></a>
        ${msg ? `<p class="login-err">${esc(msg)}</p>` : ""}
        ${local ? `<a class="dev-link" href="/auth/dev">確認用ログイン（手元のみ）</a>` : ""}
        <div class="login-foot">v${VERSION}</div>
      </div>
    </div>`;
}

function renderShell() {
  const u = state.user;
  const tabs = (cls) => VIEWS.map((v) => `<a class="tab" href="${v.path}" data-view="${v.id}">${icon(v.icon)}<span>${v.label}</span><span class="badge-slot"></span></a>`).join("");
  $("#app").innerHTML = `
    <div class="shell">
      <aside class="sidebar glass">
        <div class="brand"><div class="login-mark">${icon("invoice")}</div>REConos 経理</div>
        <div class="tab-pill"></div>
        ${tabs()}
        <div class="side-foot">${u.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : `<div class="avatar tone-blue" style="display:grid;place-items:center;font-weight:700">${esc((u.name || u.email)[0])}</div>`}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.name || u.email)}</span></div>
      </aside>
      <main class="main" id="view"></main>
      <nav class="tabbar glass"><div class="tab-pill"></div>${tabs()}</nav>
      <button class="fab" id="fab" aria-label="AI に聞く">${icon("sparkle")}</button>
    </div>`;
  $$(".tab").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    haptic(6);
    go(a.dataset.view);
  }));
  $("#fab").addEventListener("click", () => openAi());
  addEventListener("scroll", () => $(".topbar")?.classList.toggle("scrolled", scrollY > 24), { passive: true });
}

function updatePills() {
  for (const bar of $$(".tabbar, .sidebar")) {
    const on = $(`.tab[data-view="${state.view}"]`, bar);
    movePill($(".tab-pill", bar), on, bar.classList.contains("sidebar"));
  }
  $$(".seg").forEach((s) => movePill($(".seg-pill", s), $("button.on", s)));
}

function setBadges(att) {
  if (!att) return;
  state.att = att;
  const n = { invoices: (att.requested || 0) + (att.to_send || 0), expenses: att.uncategorized || 0 };
  for (const v of ["invoices", "expenses"]) {
    $$(`.tab[data-view="${v}"] .badge-slot`).forEach((s) => {
      const val = n[v] > 99 ? "99+" : n[v];
      const cur = $(".badge", s);
      if (!n[v]) { s.innerHTML = ""; return; }
      if (cur && cur.textContent === String(val)) return;
      s.innerHTML = `<span class="badge">${val}</span>`;
    });
  }
}

async function refreshBadges() {
  try { const d = await api(`/api/dashboard${state.fy ? `?fy=${state.fy}` : ""}`); setBadges(d.attention); state.dash = d; } catch {}
}

async function go(id, opts = {}) {
  const v = VIEWS.find((x) => x.id === id) || VIEWS[0];
  const changed = state.view !== v.id || opts.first;
  state.view = v.id;
  if (!opts.pop) history[opts.replace ? "replaceState" : "pushState"]({}, "", v.path + (opts.query || ""));
  $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.view === v.id));
  updatePills();
  if (!changed && !opts.force) { scrollTo({ top: 0, behavior: "smooth" }); return; }
  const swap = async () => {
    const root = $("#view");
    root.innerHTML = SKELETONS[v.id]?.() || SKELETONS.list();
    scrollTo({ top: 0 });
    try {
      await RENDER[v.id](root, opts);
    } catch (err) {
      root.innerHTML = `${topbar(v.label)}<h1 class="page-title">${esc(v.label)}</h1><div class="glass card empty-state">${icon("alert")}<div>${esc(err.message)}</div><button class="btn sm" style="margin-top:14px" id="retry">もう一度</button></div>`;
      $("#retry")?.addEventListener("click", () => go(v.id, { force: true, replace: true }));
    }
    requestAnimationFrame(updatePills);
  };
  if (document.startViewTransition && !reduceMotion && !opts.first) document.startViewTransition(() => { const r = $("#view"); r.innerHTML = SKELETONS[v.id]?.() || SKELETONS.list(); scrollTo({ top: 0 }); }).updateCallbackDone.then(swap);
  else swap();
}

const topbar = (title, right = "") => `<div class="topbar"><div class="small-title">${esc(title)}</div><div class="spacer"></div>${right}</div>`;

/* ---------- スケルトン（画面ごと） ---------- */

const skRows = (n) => Array.from({ length: n }, (_, i) => `<div class="sk-row"><div class="sk sk-av"></div><div style="flex:1"><div class="sk sk-line" style="width:${55 + ((i * 17) % 30)}%"></div><div class="sk sk-line" style="width:${30 + ((i * 11) % 20)}%;height:10px"></div></div><div class="sk sk-line" style="width:64px"></div></div>`).join("");
const SKELETONS = {
  home: () => `${topbar("")}<div class="sk sk-title"></div>
    <div class="grid two"><div class="grid">
      <div class="glass card hero"><div class="hero-row"><div><div class="sk sk-line" style="width:30%"></div><div class="sk sk-big"></div><div class="sk sk-line" style="width:50%"></div></div><div class="sk sk-circle"></div></div></div>
      <div class="stats">${'<div class="glass stat"><div class="sk sk-line"></div><div class="sk sk-line" style="height:20px"></div></div>'.repeat(3)}</div>
      <div class="glass card"><div class="sk sk-line" style="width:24%"></div><div class="sk-bars">${[40, 65, 50, 80, 35, 60, 45, 70, 55, 30, 50, 62].map((h) => `<div class="sk" style="height:${h}%"></div>`).join("")}</div></div>
    </div><div class="grid"><div class="glass card"><div class="sk sk-line" style="width:30%"></div>${skRows(4)}</div><div class="glass card"><div class="sk sk-line" style="width:30%"></div>${'<div class="sk sk-line"></div>'.repeat(6)}</div></div></div>`,
  list: () => `${topbar("")}<div class="sk sk-title"></div><div class="sk" style="height:42px;border-radius:18px;margin-bottom:14px"></div><div class="glass list">${skRows(8)}</div>`,
  more: () => `${topbar("")}<div class="sk sk-title"></div><div class="grid">${'<div class="glass card">' + skRows(2) + "</div>"}${'<div class="glass card">' + skRows(3) + "</div>"}</div>`,
};

/* ---------- ホーム ---------- */

const RENDER = {};

RENDER.home = async (root) => {
  const d = await api(`/api/dashboard${state.fy ? `?fy=${state.fy}` : ""}`);
  state.fy = d.fy;
  state.dash = d;
  setBadges(d.attention);
  const t = d.totals;
  const pct = d.target ? Math.min(999, (t.sales / d.target) * 100) : null;
  const prevSameMonths = (() => {
    // 前の期の、今期と同じ月までの売上（比べられる月だけ）
    const n = d.months.filter((m) => m.sales !== null).length;
    return d.prevMonths.slice(0, n).reduce((a, m) => a + (m.sales || 0), 0);
  })();
  const yoy = prevSameMonths ? ((t.sales - prevSameMonths) / prevSameMonths) * 100 : null;
  const max = Math.max(1, ...d.months.map((m) => Math.max(m.sales || 0, (m.out || 0) + (m.exp_total || 0))), d.target ? d.target / 12 : 0);
  const nowYm = d.today.slice(0, 7);
  const cats = Object.entries(d.catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const catMax = Math.max(1, ...cats.map((c) => c[1]));
  const a = d.attention;
  const todo = [
    { n: a.requested, label: "作成待ちの請求書", sub: "Mac の仕組みが INVOY で作ります", ic: "clock", tone: "violet", go: ["invoices", "?f=requested"] },
    { n: a.to_send, label: "送付待ちの請求書", sub: "下書きを確かめて送る", ic: "send", tone: "orange", go: ["invoices", "?f=ready"] },
    { n: a.unpaid, label: "未入金", sub: yen(a.unpaid_total) + (a.overdue ? ` ・ 期限切れ ${a.overdue}件` : ""), ic: "yen", tone: a.overdue ? "red" : "blue", go: ["invoices", "?f=sent"] },
    { n: a.uncategorized, label: "科目が決まっていない明細", sub: "AI の候補から選べます", ic: "tag", tone: "gray", go: ["expenses", "?cat=_unknown"] },
  ].filter((x) => x.n);

  root.innerHTML = `
    ${topbar("ホーム", `<button class="icon-btn accent" id="newInv" aria-label="請求書を作る">${icon("plus")}</button>`)}
    <h1 class="page-title">ホーム</h1>
    <div class="period glass thin">
      <button id="fyPrev" aria-label="前の期">${icon("left")}</button>
      <span>第${d.fy}期 <small style="color:var(--text-2);font-weight:600">${ymLabel(d.fyRange[0])}–${ymLabel(d.fyRange[1])}</small></span>
      <button id="fyNext" aria-label="次の期" ${d.fy >= d.thisFy ? "disabled" : ""}>${icon("right")}</button>
    </div>
    <div class="grid two">
      <div class="grid">
        <section class="glass card hero enter" style="--i:0">
          <div class="hero-row">
            <div>
              <div class="label">今期の売上（税抜）</div>
              <div class="big num"><span id="heroSales">0</span><small>円</small></div>
              <div class="sub">
                ${yoy !== null ? `<span class="chip ${yoy >= 0 ? "up" : "down"}">${yoy >= 0 ? "▲" : "▼"} ${Math.abs(yoy).toFixed(1)}%</span><span>前期の同じ時期と比べて</span>` : `<span>前期の数字なし</span>`}
              </div>
            </div>
            ${pct !== null ? `<div class="ring"><svg viewBox="0 0 108 108"><circle class="track" cx="54" cy="54" r="46" fill="none" stroke-width="10"/><circle class="bar" id="ringBar" cx="54" cy="54" r="46" fill="none" stroke-width="10" stroke-dasharray="289" stroke-dashoffset="289"/></svg><div class="pct num"><div><span id="ringPct">0</span>%<small>目標 ${man(d.target)}</small></div></div></div>` : ""}
          </div>
        </section>
        <div class="stats">
          <div class="glass stat enter" style="--i:1"><div class="k"><i style="background:var(--orange)"></i>外注費</div><div class="v num"><span data-count="${t.out}">0</span></div><div class="s">${t.sales ? `売上の ${((t.out / t.sales) * 100).toFixed(0)}%` : "—"}</div></div>
          <div class="glass stat enter" style="--i:2"><div class="k"><i style="background:var(--violet)"></i>経費</div><div class="v num"><span data-count="${t.exp}">0</span></div><div class="s">${t.sales ? `売上の ${((t.exp / t.sales) * 100).toFixed(0)}%` : "—"}</div></div>
          <div class="glass stat enter" style="--i:3"><div class="k"><i style="background:var(--green)"></i>残り</div><div class="v num" style="color:${t.profit < 0 ? "var(--red)" : "inherit"}"><span data-count="${t.profit}">0</span></div><div class="s">売上 − 外注 − 経費</div></div>
        </div>
        <section class="glass card enter" style="--i:4">
          <h3>月ごと<span class="more" style="color:var(--text-3);font-weight:500">月を押すと内訳</span></h3>
          <div class="chart" id="chart">
            ${d.target ? `<div class="target-line" style="bottom:calc(${((d.target / 12) / max) * 100}% * (190/210) + 20px)"><span>月の目標 ${man(d.target / 12)}</span></div>` : ""}
            ${d.months.map((m, i) => {
              const cost = (m.out || 0) + (m.exp_total || 0);
              const empty = m.source === "none";
              return `<div class="col ${m.ym === nowYm ? "now" : ""}" data-ym="${m.ym}" style="--i:${i}">
                <div class="bars">${empty ? `<div class="b empty"></div>` : `<div class="b sales" style="height:${((m.sales || 0) / max) * 100}%;--i:${i}"></div><div class="b cost" style="height:${(cost / max) * 100}%;--i:${i}"></div>`}</div>
                <div class="m">${Number(m.ym.slice(5))}</div></div>`;
            }).join("")}
          </div>
          <div class="legend"><span><i style="background:var(--accent)"></i>売上</span><span><i style="background:var(--orange)"></i>外注費＋経費</span></div>
        </section>
      </div>
      <div class="grid">
        <section class="glass card enter" style="--i:5">
          <h3>要対応</h3>
          ${todo.length ? `<div class="todo">${todo.map((x, i) => `<button class="todo-row pressable" data-go="${x.go[0]}" data-q="${x.go[1]}"><span class="ico tone-${x.tone}">${icon(x.ic)}</span><span class="t">${esc(x.label)}<small>${esc(x.sub)}</small></span><span class="n num">${x.n}</span><span class="chev">${icon("right")}</span></button>`).join("")}</div>` : `<div style="color:var(--text-2);font-size:14px;padding:4px 2px">対応が必要なものはありません</div>`}
        </section>
        <section class="glass card enter" style="--i:6">
          <h3>経費の内訳（今期）</h3>
          ${cats.length ? cats.map(([c, v], i) => `<div class="hbar"><span class="name">${esc(c)}</span><span class="track"><span class="fill" style="display:block;width:${(v / catMax) * 100}%;--i:${i}"></span></span><span class="val num">${man(v)}</span></div>`).join("") : `<div style="color:var(--text-2);font-size:14px">明細がまだありません</div>`}
        </section>
        <section class="glass card enter pressable" style="--i:7;cursor:pointer" id="askCard">
          <h3><span class="ico ai-sparkle" style="width:26px;height:26px;border-radius:9px;display:grid;place-items:center">${icon("sparkle")}</span>AI に聞く</h3>
          <div class="suggest" style="margin:0">${["目標に届くペース？", "経費が増えた科目は？", "未入金はいくら？"].map((q) => `<button data-ask="${esc(q)}">${esc(q)}</button>`).join("")}</div>
        </section>
      </div>
    </div>
    <p class="foot-note">${d.importedAsof ? `取り込んだ集計：${esc(d.importedAsof)} 時点${d.dataVersion ? `（${esc(d.dataVersion)}）` : ""}・` : ""}それ以降はアプリに入った請求書・明細から計算</p>`;

  countUp($("#heroSales"), t.sales);
  $$("[data-count]", root).forEach((el) => countUp(el, Number(el.dataset.count), (n) => man(n)));
  if (pct !== null) {
    requestAnimationFrame(() => requestAnimationFrame(() => { $("#ringBar").style.strokeDashoffset = 289 - (289 * Math.min(100, pct)) / 100; }));
    countUp($("#ringPct"), pct, (n) => n.toFixed(0), 1400);
  }
  $("#fyPrev").onclick = () => { state.fy = d.fy - 1; go("home", { force: true, replace: true }); };
  $("#fyNext").onclick = () => { state.fy = d.fy + 1; go("home", { force: true, replace: true }); };
  $("#newInv").onclick = () => openNewInvoice();
  $$(".todo-row", root).forEach((b) => b.onclick = () => go(b.dataset.go, { query: b.dataset.q }));
  $$(".col", root).forEach((c) => c.onclick = () => openMonth(d.months.find((m) => m.ym === c.dataset.ym)));
  $("#askCard").onclick = (e) => { const q = e.target.closest("[data-ask]")?.dataset.ask; openAi(q); };
};

function openMonth(m) {
  if (!m) return;
  const cats = Object.entries(m.exp || {}).sort((a, b) => b[1] - a[1]);
  const profit = (m.sales || 0) - (m.out || 0) - (m.exp_total || 0);
  openSheet({
    title: ymLong(m.ym),
    html: m.source === "none" ? `<div class="empty-state">${icon("file")}<div>この月のデータはまだありません</div></div>` : `
      <div class="sum-box">
        <div class="l"><span>売上${m.sales_n ? `（${m.sales_n}件）` : ""}</span><span class="num">${yen(m.sales)}</span></div>
        <div class="l"><span>外注費${m.out_n ? `（${m.out_n}件）` : ""}</span><span class="num">${yen(m.out)}</span></div>
        <div class="l"><span>経費</span><span class="num">${yen(m.exp_total)}</span></div>
        <div class="l total"><span>残り</span><span class="num" style="color:${profit < 0 ? "var(--red)" : "inherit"}">${yen(profit)}</span></div>
      </div>
      ${cats.length ? `<div class="group-h"><span>経費の科目</span></div><div class="glass thin list">${cats.map(([c, v]) => `<div class="row"><div class="main-t"><div class="ttl">${esc(c)}</div></div><div class="amt num">${yen(v)}</div></div>`).join("")}</div>` : ""}
      ${m.exp_unk ? `<p class="result">中身の分からない支払い（電子マネー・要確認）${yen(m.exp_unk)} は経費に入れていません</p>` : ""}
      <p class="result">${m.source === "import" ? "取り込んだ集計の数字です" : "アプリに入った請求書・明細から計算した数字です"}</p>
      <button class="btn block" style="margin-top:12px" id="toTx">${icon("card")}この月の明細を見る</button>`,
    onMount: (s) => { $("#toTx", s.el)?.addEventListener("click", () => { s.close(); go("expenses", { query: `?ym=${m.ym}`, force: true }); }); },
  });
}

/* ---------- 請求書 ---------- */

const ST = {
  requested: { label: "作成待ち", tone: "violet" },
  draft: { label: "作成済み", tone: "blue" },
  ready: { label: "送付待ち", tone: "orange" },
  sent: { label: "未入金", tone: "blue" },
  paid: { label: "入金済", tone: "green" },
  canceled: { label: "取消", tone: "gray" },
};
const FLOW = ["requested", "draft", "ready", "sent", "paid"];
const FLOW_LABEL = ["作成待ち", "作成済み", "送付待ち", "請求済", "入金済"];
const NEXT_LABEL = { requested: "作成済みにする", draft: "送付待ちにする", ready: "送ったので請求済にする", sent: "入金済にする" };
const statusChip = (s) => `<span class="status tone-${ST[s]?.tone || "gray"}">${ST[s]?.label || s}</span>`;
const initial = (s) => esc(String(s).replace(/^(株式会社|合同会社|有限会社|一般社団法人|\(株\)|㈱)\s*/, "").trim()[0] || "?");
const TONES = ["blue", "violet", "orange", "green", "red"];
const toneOf = (s) => TONES[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

RENDER.invoices = async (root) => {
  const f = new URLSearchParams(location.search).get("f") || "all";
  const [{ items, clients }, pay] = await Promise.all([api("/api/invoices"), api("/api/payments").catch(() => ({ items: [] }))]);
  state.clients = clients;
  const counts = Object.fromEntries(Object.keys(ST).map((k) => [k, items.filter((x) => x.status === k).length]));
  const filters = [
    ["all", "すべて", items.length],
    ["requested", "作成待ち", counts.requested],
    ["ready", "送付待ち", counts.ready + counts.draft],
    ["sent", "未入金", counts.sent],
    ["paid", "入金済", counts.paid],
  ];
  const draw = (key) => {
    const list = items.filter((x) => key === "all" ? true : key === "ready" ? ["draft", "ready"].includes(x.status) : x.status === key);
    const groups = {};
    for (const x of list) (groups[x.issue_date.slice(0, 7)] ||= []).push(x);
    $("#invList").innerHTML = list.length ? Object.entries(groups).map(([ym, arr], gi) => `
      <div class="group-h enter" style="--i:${gi}"><span>${ymLong(ym)}</span><span class="num">税抜 ${yen(arr.reduce((a, x) => a + x.amount, 0))}</span></div>
      <div class="glass list enter" style="--i:${gi + 1}">${arr.map((x) => `
        <button class="row" data-id="${x.id}">
          <span class="avatar-s tone-${toneOf(x.client)}">${initial(x.client)}</span>
          <span class="main-t"><span class="ttl" style="display:block">${esc(x.client)}</span><span class="meta" style="display:block">${esc(x.title || "件名なし")}・${dateLabel(x.issue_date)}${x.send_via === "line" ? "・LINE" : ""}</span></span>
          <span class="amt num">${yen(x.total)}<small>${statusChip(x.status)}</small></span>
        </button>`).join("")}</div>`).join("")
      : `<div class="glass card empty-state enter">${icon("invoice")}<div>${key === "all" ? "請求書はまだありません" : "該当する請求書はありません"}</div>${key === "all" ? `<button class="btn primary sm" style="margin-top:14px" id="emptyNew">${icon("plus")}請求書を作る</button>` : ""}</div>`;
    $$("#invList .row").forEach((r) => r.onclick = () => openInvoice(items.find((x) => x.id === r.dataset.id)));
    $("#emptyNew")?.addEventListener("click", () => openNewInvoice());
  };
  root.innerHTML = `
    ${topbar("請求書", `<button class="icon-btn accent" id="newInv" aria-label="請求書を作る">${icon("plus")}</button>`)}
    <h1 class="page-title">請求書</h1>
    ${pay.items.length ? `<div class="banner glass enter"><span class="ico tone-green" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center">${icon("bank")}</span><span class="t">入金が確認できた請求書 ${pay.items.length}件<small>口座の入金と請求額が一致しました</small></span><button class="btn sm primary" id="payBtn">確認</button></div>` : ""}
    <div class="seg glass thin"><div class="seg-pill"></div>${filters.map(([k, l, n]) => `<button data-f="${k}" class="${k === f ? "on" : ""}">${l}<span class="cnt">${n || ""}</span></button>`).join("")}</div>
    <div id="invList"></div>`;
  draw(f);
  $$(".seg button", root).forEach((b) => b.onclick = () => {
    $$(".seg button", root).forEach((x) => x.classList.toggle("on", x === b));
    movePill($(".seg-pill", root), b);
    haptic(5);
    history.replaceState({}, "", `/invoices${b.dataset.f === "all" ? "" : `?f=${b.dataset.f}`}`);
    draw(b.dataset.f);
  });
  $("#newInv").onclick = () => openNewInvoice();
  $("#payBtn")?.addEventListener("click", () => openPayments(pay.items));
};

function openPayments(list) {
  openSheet({
    title: "入金の確認",
    html: `<div class="glass thin list">${list.map((p) => `
      <div class="row"><span class="main-t"><span class="ttl" style="display:block">${esc(p.invoice.client)}</span><span class="meta" style="display:block">${dateLabel(p.tx.date)} 入金・${esc(p.tx.descr)}</span></span>
      <span class="amt num">${yen(p.invoice.total)}<small><button class="btn sm primary" data-id="${p.invoice.id}" data-date="${p.tx.date}">入金済にする</button></small></span></div>`).join("")}</div>`,
    onMount: (s) => $$("[data-id]", s.el).forEach((b) => b.onclick = async () => {
      b.disabled = true;
      await api(`/api/invoices/${b.dataset.id}`, { method: "PUT", body: { status: "paid", paid_date: b.dataset.date } });
      b.closest(".row").style.opacity = 0.4;
      b.textContent = "入金済";
      toast("入金済にしました");
      refreshBadges();
      if (!$$("[data-id]:not(:disabled)", s.el).length) { s.close(); go("invoices", { force: true, replace: true }); }
    }),
  });
}

function openInvoice(x) {
  const idx = FLOW.indexOf(x.status);
  openSheet({
    title: x.client,
    html: `
      ${x.status === "canceled" ? `<p>${statusChip("canceled")}</p>` : `<div class="steps">${FLOW.map((s, i) => `<div class="st ${i < idx ? "done" : i === idx ? "cur" : ""}"><div class="dot">${i < idx ? icon("check") : ""}</div>${FLOW_LABEL[i]}</div>`).join("")}</div>`}
      <div class="sum-box">
        <div class="l"><span>税抜</span><span class="num">${yen(x.amount)}</span></div>
        <div class="l"><span>消費税</span><span class="num">${yen(x.tax)}</span></div>
        ${x.withholding ? `<div class="l"><span>源泉徴収</span><span class="num">−${yen(x.withholding)}</span></div>` : ""}
        <div class="l total"><span>請求額</span><span class="num">${yen(x.total)}</span></div>
      </div>
      <dl class="kv">
        <dt>件名</dt><dd>${esc(x.title || "—")}</dd>
        <dt>発行日</dt><dd>${esc(x.issue_date)}</dd>
        <dt>支払期限</dt><dd>${esc(x.due_date || "—")}</dd>
        <dt>送り方</dt><dd>${x.send_via === "line" ? "LINE" : "メール（info@）"}</dd>
        ${x.paid_date ? `<dt>入金日</dt><dd>${esc(x.paid_date)}</dd>` : ""}
        ${x.request_text ? `<dt>依頼の文</dt><dd style="font-weight:500">${esc(x.request_text)}</dd>` : ""}
      </dl>
      <label class="field"><span>請求書番号</span><input class="input" id="fNum" value="${esc(x.number)}" placeholder="INVOY の番号"></label>
      <label class="field"><span>Drive のリンク</span><input class="input" id="fDrive" value="${esc(x.drive_url)}" placeholder="https://drive.google.com/…" inputmode="url"></label>
      <label class="field"><span>メモ</span><textarea class="textarea" id="fNote" rows="2">${esc(x.note)}</textarea></label>
      ${x.drive_url ? `<a class="btn block" href="${esc(x.drive_url)}" target="_blank" rel="noopener" style="margin-bottom:10px">${icon("link")}PDF を開く</a>` : ""}
      <div class="btn-row" style="margin-bottom:10px">
        <button class="btn" id="save">保存</button>
        ${NEXT_LABEL[x.status] ? `<button class="btn primary" id="next">${NEXT_LABEL[x.status]}</button>` : ""}
      </div>
      ${x.status === "requested" ? `<button class="btn block danger" id="del">${icon("trash")}依頼を取り消す</button>` : x.status !== "canceled" && x.status !== "paid" ? `<button class="btn block danger" id="cancel">取消にする</button>` : ""}`,
    onMount: (s) => {
      const fields = () => ({ number: $("#fNum", s.el).value.trim(), drive_url: $("#fDrive", s.el).value.trim(), note: $("#fNote", s.el).value });
      const done = (msg) => { toast(msg); s.close(); refreshBadges(); go("invoices", { force: true, replace: true, query: location.search }); };
      $("#save", s.el).onclick = async () => { await api(`/api/invoices/${x.id}`, { method: "PUT", body: fields() }); done("保存しました"); };
      $("#next", s.el)?.addEventListener("click", async () => {
        const next = FLOW[idx + 1];
        await api(`/api/invoices/${x.id}`, { method: "PUT", body: { ...fields(), status: next } });
        haptic([8, 30, 8]);
        done(`${FLOW_LABEL[idx + 1]}にしました`);
      });
      $("#del", s.el)?.addEventListener("click", async () => {
        if (!confirm("この依頼を取り消しますか？")) return;
        await api(`/api/invoices/${x.id}`, { method: "DELETE" });
        done("依頼を取り消しました");
      });
      $("#cancel", s.el)?.addEventListener("click", async () => {
        if (!confirm("この請求書を取消にしますか？（INVOY 側の請求書は変わりません）")) return;
        await api(`/api/invoices/${x.id}`, { method: "PUT", body: { status: "canceled" } });
        done("取消にしました");
      });
    },
  });
}

function openNewInvoice() {
  const clients = state.clients || [];
  openSheet({
    title: "請求書を作る",
    html: `
      <div id="step1">
        <label class="field"><span>どこに、いくら</span><textarea class="textarea" id="req" rows="3" placeholder="例：株式会社ABC に 25万円、件名「10月度 映像制作費」"></textarea></label>
        ${clients.length ? `<div class="chips" style="margin:0 -18px 10px;padding:2px 18px 6px">${clients.slice(0, 12).map((c) => `<button data-c="${esc(c.client)}">${esc(c.client)}</button>`).join("")}</div>` : ""}
        <button class="btn primary block" id="parse">${icon("sparkle")}読み取る</button>
        <button class="btn block" id="manual" style="margin-top:10px;box-shadow:none;background:transparent;color:var(--accent)">自分で入力する</button>
      </div>
      <div id="step2" hidden></div>`,
    onMount: (s) => {
      const req = $("#req", s.el);
      setTimeout(() => req.focus(), 350);
      $$("[data-c]", s.el).forEach((b) => b.onclick = () => { req.value = `${b.dataset.c} に `; req.focus(); });
      $("#parse", s.el).onclick = async () => {
        const text = req.value.trim();
        if (!text) { req.focus(); return; }
        const btn = $("#parse", s.el);
        btn.disabled = true;
        btn.innerHTML = `<span class="shimmer-text" style="color:#fff">読み取っています…</span>`;
        try {
          const p = await api("/api/ai/parse-invoice", { method: "POST", body: { text } });
          showForm(s, { ...p, request_text: text });
        } catch (e) { toast(e.message, true); btn.disabled = false; btn.innerHTML = `${icon("sparkle")}読み取る`; }
      };
      $("#manual", s.el).onclick = () => showForm(s, { client: "", amount: 0, title: "", issue_date: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), due_date: "", withholding: false });
    },
  });
}

function showForm(s, p) {
  $("#step1", s.el).hidden = true;
  const st2 = $("#step2", s.el);
  st2.hidden = false;
  st2.innerHTML = `
    <div class="enter">
      ${p.via ? `<p class="result" style="margin:0 0 12px">${p.via === "ai" ? "✦ AI が読み取りました。" : "読み取りました。"}違うところは直してください</p>` : ""}
      <label class="field"><span>宛先</span><input class="input" id="c" value="${esc(p.client)}" placeholder="株式会社◯◯" list="clientList"></label>
      <datalist id="clientList">${(state.clients || []).map((c) => `<option value="${esc(c.client)}">`).join("")}</datalist>
      <label class="field"><span>件名</span><input class="input" id="t" value="${esc(p.title)}" placeholder="10月度 映像制作費"></label>
      <label class="field"><span>金額（税抜）</span><input class="input num" id="a" value="${p.amount || ""}" inputmode="numeric" placeholder="250000"></label>
      <div class="field-row">
        <label class="field"><span>発行日</span><input class="input" type="date" id="i" value="${esc(p.issue_date)}"></label>
        <label class="field"><span>支払期限</span><input class="input" type="date" id="d" value="${esc(p.due_date)}"></label>
      </div>
      <div class="toggle-row"><span>源泉徴収する<small style="display:block;font-weight:500;color:var(--text-2);font-size:12px">個人あての報酬のとき</small></span><label class="switch"><input type="checkbox" id="w" ${p.withholding ? "checked" : ""}><span></span></label></div>
      <div class="toggle-row"><span>LINE で送る</span><label class="switch"><input type="checkbox" id="l" ${p.send_via === "line" ? "checked" : ""}><span></span></label></div>
      <div class="sum-box" id="sum"></div>
      <button class="btn primary block" id="submit">${icon("send")}作成を依頼する</button>
    </div>`;
  const calc = () => {
    const a = Math.round(Number(String($("#a", st2).value).replace(/[^\d]/g, "")) || 0);
    const tax = Math.floor(a * 0.1);
    const w = $("#w", st2).checked ? (a <= 1000000 ? Math.floor(a * 0.1021) : Math.floor(102100 + (a - 1000000) * 0.2042)) : 0;
    $("#sum", st2).innerHTML = `<div class="l"><span>税抜</span><span class="num">${yen(a)}</span></div><div class="l"><span>消費税 10%</span><span class="num">${yen(tax)}</span></div>${w ? `<div class="l"><span>源泉徴収</span><span class="num">−${yen(w)}</span></div>` : ""}<div class="l total"><span>請求額</span><span class="num">${yen(a + tax - w)}</span></div>`;
    return a;
  };
  calc();
  ["a", "w"].forEach((id) => $(`#${id}`, st2).addEventListener("input", calc));
  $("#submit", st2).onclick = async () => {
    const amount = calc();
    const client = $("#c", st2).value.trim();
    if (!client || !amount) { toast("宛先と金額を入れてください", true); return; }
    $("#submit", st2).disabled = true;
    try {
      await api("/api/invoices", { method: "POST", body: {
        client, title: $("#t", st2).value.trim(), amount, issue_date: $("#i", st2).value, due_date: $("#d", st2).value,
        withholding: $("#w", st2).checked, send_via: $("#l", st2).checked ? "line" : "mail", request_text: p.request_text || "",
      } });
      haptic([8, 30, 8]);
      toast("作成待ちに入れました");
      s.close();
      refreshBadges();
      go("invoices", { force: true, replace: state.view === "invoices", query: "?f=requested" });
    } catch (e) { toast(e.message, true); $("#submit", st2).disabled = false; }
  };
}

/* ---------- 明細 ---------- */

const SRC = { "01": "法人AMEX", "02": "兼用AMEX", "03": "法人口座", "04": "デビット" };
const CAT_TONE = (c) => c === "要確認" || !c ? "red" : c.startsWith("私用") ? "gray" : c === "入金" ? "green" : c.includes("外注") || c.includes("役員") ? "orange" : "blue";

RENDER.expenses = async (root) => {
  const q = new URLSearchParams(location.search);
  const sel = { ym: q.get("ym") || "", src: q.get("src") || "", cat: q.get("cat") || "" };
  const load = async () => {
    const p = new URLSearchParams(Object.entries(sel).filter(([, v]) => v));
    return api(`/api/transactions?${p}`);
  };
  let data = await load();
  const months = data.months;
  root.innerHTML = `
    ${topbar("明細", state.ai ? `<button class="icon-btn" id="aiSuggest" aria-label="AI で科目の候補を出す" style="color:var(--violet)">${icon("sparkle")}</button>` : "")}
    <h1 class="page-title">明細</h1>
    <div class="chips" id="monthChips"><button data-ym="" class="${!sel.ym ? "on" : ""}">すべての月</button>${months.map((m) => `<button data-ym="${m.ym}" class="${sel.ym === m.ym ? "on" : ""}">${ymLong(m.ym)}</button>`).join("")}</div>
    <div class="seg glass thin"><div class="seg-pill"></div>${[["", "すべて"], ...Object.entries(SRC)].map(([k, l]) => `<button data-src="${k}" class="${sel.src === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="toggle-row" style="padding:0 4px 12px"><span>科目が決まっていないものだけ</span><label class="switch"><input type="checkbox" id="unk" ${sel.cat === "_unknown" ? "checked" : ""}><span></span></label></div>
    <div id="txList"></div>`;
  const draw = () => {
    const items = data.items;
    const total = items.reduce((a, t) => a + (t.amount || 0) + (t.fee || 0), 0);
    $("#txList").innerHTML = items.length ? `
      <div class="group-h"><span>${items.length >= 400 ? "最新 400 件" : `${items.length}件`}</span><span class="num">出金 ${yen(total)}</span></div>
      <div class="glass list enter">${items.map((t) => `
        <button class="row" data-id="${t.id}">
          <span class="main-t"><span class="ttl" style="display:block">${esc(t.descr)}</span><span class="meta" style="display:block">${dateLabel(t.date)}・${SRC[t.src]}${t.member && t.src === "02" ? `・${esc(t.member)}` : ""}</span></span>
          <span class="amt num">${t.inflow ? `<span style="color:var(--green)">+${yen(t.inflow)}</span>` : yen(t.amount + (t.fee || 0))}<small><span class="status tone-${CAT_TONE(t.category)}">${esc(t.category || "要確認")}${t.ai_suggest && t.category === "要確認" ? ` → ${esc(t.ai_suggest)}?` : ""}</span></small></span>
        </button>`).join("")}</div>`
      : `<div class="glass card empty-state">${icon("card")}<div>${months.length ? "該当する明細はありません" : "明細がまだありません。「その他」から CSV を取り込めます"}</div>${months.length ? "" : `<button class="btn sm" style="margin-top:14px" id="toImport">${icon("upload")}取り込みへ</button>`}</div>`;
    $$("#txList .row").forEach((r) => r.onclick = () => openTx(data.items.find((t) => t.id === r.dataset.id), data.categories, async () => { data = await load(); draw(); refreshBadges(); }));
    $("#toImport")?.addEventListener("click", () => go("more"));
  };
  draw();
  const reload = async () => {
    const p = new URLSearchParams(Object.entries(sel).filter(([, v]) => v));
    history.replaceState({}, "", `/expenses${p.toString() ? `?${p}` : ""}`);
    $("#txList").innerHTML = `<div class="glass list">${skRows(6)}</div>`;
    data = await load();
    draw();
  };
  $$("#monthChips button").forEach((b) => b.onclick = () => { $$("#monthChips button").forEach((x) => x.classList.toggle("on", x === b)); sel.ym = b.dataset.ym; haptic(5); reload(); });
  $$(".seg button", root).forEach((b) => b.onclick = () => { $$(".seg button", root).forEach((x) => x.classList.toggle("on", x === b)); movePill($(".seg-pill", root), b); sel.src = b.dataset.src; haptic(5); reload(); });
  $("#unk").onchange = (e) => { sel.cat = e.target.checked ? "_unknown" : ""; reload(); };
  $("#monthChips .on")?.scrollIntoView({ inline: "center", block: "nearest" });
  $("#aiSuggest")?.addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    b.style.animation = "blink 1s infinite";
    try {
      const r = await api("/api/ai/suggest", { method: "POST", body: {} });
      if (r.error) toast(r.error, true);
      else toast(r.items.length ? `${r.items.length}件の利用先に科目の候補を出しました` : "候補を出す明細はありません");
      data = await load(); draw();
    } catch (err) { toast(err.message, true); }
    b.disabled = false; b.style.animation = "";
  });
};

function openTx(t, cats, after) {
  const cur = t.category;
  const selectable = t.src === "03" ? [...cats, "外注費（口座からの支払い）", "役員への支払い", "借入金の返済", "貸付金", "入金"] : [...cats, "私用（法人カード・デビット）", "私用（兼用カード）"];
  openSheet({
    title: "科目を選ぶ",
    html: `
      <div class="sum-box">
        <div class="l"><span>${esc(t.date)}・${SRC[t.src]}</span><span class="num" style="font-weight:700;color:var(--text)">${t.inflow ? `+${yen(t.inflow)}` : yen(t.amount + (t.fee || 0))}</span></div>
        <div style="font-weight:650;margin-top:4px;word-break:break-all">${esc(t.descr)}</div>
      </div>
      ${t.ai_suggest ? `<p class="result" style="margin:0">✦ AI の候補：<b style="color:var(--violet)">${esc(t.ai_suggest)}</b></p>` : ""}
      ${t.src !== "03" && t.rule_key ? `<div class="toggle-row"><span>「${esc(t.rule_key)}」は次から同じ科目<small style="display:block;font-weight:500;color:var(--text-2);font-size:12px">まだ決まっていない同じ利用先にも当てます</small></span><label class="switch"><input type="checkbox" id="remember" checked><span></span></label></div>` : ""}
      <div class="cat-grid">${selectable.map((c) => `<button data-c="${esc(c)}" class="${c === cur ? "on" : ""} ${c === t.ai_suggest ? "ai" : ""}">${esc(c)}</button>`).join("")}</div>`,
    onMount: (s) => $$(".cat-grid button", s.el).forEach((b) => b.onclick = async () => {
      $$(".cat-grid button", s.el).forEach((x) => x.classList.toggle("on", x === b));
      haptic(8);
      try {
        const r = await api(`/api/transactions/${t.id}`, { method: "PUT", body: { category: b.dataset.c, remember: !!$("#remember", s.el)?.checked } });
        toast(r.applied > 1 ? `${r.applied}件を「${b.dataset.c}」にしました` : `「${b.dataset.c}」にしました`);
        setTimeout(() => s.close(), 180);
        after();
      } catch (e) { toast(e.message, true); }
    }),
  });
}

/* ---------- 外注 ---------- */

RENDER.vendors = async (root) => {
  const { items } = await api("/api/vendors");
  const groups = {};
  for (const x of items) (groups[x.ym] ||= []).push(x);
  root.innerHTML = `
    ${topbar("外注", `<button class="icon-btn accent" id="addV" aria-label="外注の請求書を足す">${icon("plus")}</button>`)}
    <h1 class="page-title">外注</h1>
    ${items.length ? Object.entries(groups).map(([ym, arr], gi) => `
      <div class="group-h enter" style="--i:${gi}"><span>${ymLong(ym)}分</span><span class="num">${yen(arr.reduce((a, x) => a + x.amount, 0))}・${arr.length}件</span></div>
      <div class="glass list enter" style="--i:${gi + 1}">${arr.map((x) => `
        <button class="row" data-id="${x.id}"><span class="avatar-s tone-${toneOf(x.vendor)}">${initial(x.vendor)}</span>
        <span class="main-t"><span class="ttl" style="display:block">${esc(x.vendor)}</span><span class="meta" style="display:block">${esc(x.note || (x.drive_url ? "Drive に保存済み" : "—"))}</span></span>
        <span class="amt num">${yen(x.amount)}</span></button>`).join("")}</div>`).join("")
    : `<div class="glass card empty-state enter">${icon("people")}<div>外注の請求書はまだありません</div><button class="btn primary sm" style="margin-top:14px" id="addV2">${icon("plus")}足す</button></div>`}`;
  const add = () => openSheet({
    title: "外注の請求書を足す",
    html: `
      <label class="field"><span>外注先</span><input class="input" id="v"></label>
      <div class="field-row">
        <label class="field"><span>何月分</span><input class="input" type="month" id="m" value="${new Date(Date.now() + 9 * 3600000 - 20 * 86400000).toISOString().slice(0, 7)}"></label>
        <label class="field"><span>税抜の本体</span><input class="input num" id="a" inputmode="numeric"></label>
      </div>
      <label class="field"><span>Drive のリンク</span><input class="input" id="u" inputmode="url" placeholder="https://drive.google.com/…"></label>
      <label class="field"><span>メモ</span><input class="input" id="n"></label>
      <p class="result" style="margin:-4px 4px 14px">月は請求書に書かれた「何月分」で決めます</p>
      <button class="btn primary block" id="save">足す</button>`,
    onMount: (s) => $("#save", s.el).onclick = async () => {
      try {
        await api("/api/vendors", { method: "POST", body: { vendor: $("#v", s.el).value.trim(), ym: $("#m", s.el).value, amount: $("#a", s.el).value, drive_url: $("#u", s.el).value.trim(), note: $("#n", s.el).value.trim() } });
        toast("足しました"); s.close(); go("vendors", { force: true, replace: true });
      } catch (e) { toast(e.message, true); }
    },
  });
  $("#addV").onclick = add;
  $("#addV2")?.addEventListener("click", add);
  $$(".row", root).forEach((r) => r.onclick = () => {
    const x = items.find((i) => i.id === r.dataset.id);
    openSheet({
      title: x.vendor,
      html: `<dl class="kv"><dt>何月分</dt><dd>${ymLong(x.ym)}</dd><dt>税抜の本体</dt><dd class="num">${yen(x.amount)}</dd><dt>メモ</dt><dd>${esc(x.note || "—")}</dd></dl>
        ${x.drive_url ? `<a class="btn block" href="${esc(x.drive_url)}" target="_blank" rel="noopener" style="margin-bottom:10px">${icon("link")}請求書を開く</a>` : ""}
        <button class="btn block danger" id="del">${icon("trash")}この行を消す</button>`,
      onMount: (s) => $("#del", s.el).onclick = async () => {
        if (!confirm(`${x.vendor}（${ymLong(x.ym)}分 ${yen(x.amount)}）をアプリから消しますか？ Drive の PDF は消えません`)) return;
        await api(`/api/vendors/${x.id}`, { method: "DELETE" });
        toast("消しました"); s.close(); go("vendors", { force: true, replace: true });
      },
    });
  });
};

/* ---------- その他（取り込み・設定） ---------- */

async function readText(file) {
  const buf = await file.arrayBuffer();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { return new TextDecoder("shift_jis").decode(buf); }
}

RENDER.more = async (root) => {
  const { settings, counts } = await api("/api/settings");
  const u = state.user;
  const tile = (id, ic, tone, title, sub, accept, multi) => `
    <label class="import-tile glass pressable enter" style="--i:${id.length % 5}" for="${id}">
      <span class="ico tone-${tone}">${icon(ic)}</span><span class="t">${title}<small>${sub}</small><span class="result" id="${id}R"></span></span>
      <span class="chev" style="color:var(--text-3)">${icon("upload")}</span>
      <input type="file" id="${id}" accept="${accept}" ${multi ? "multiple" : ""}>
    </label>`;
  root.innerHTML = `
    ${topbar("その他")}
    <h1 class="page-title">その他</h1>
    <div class="grid two">
      <div class="grid">
        <div class="group-h"><span>カード・口座の明細（CSV）</span><span>${counts.tx.toLocaleString()}件</span></div>
        ${tile("csv01", "card", "blue", "法人AMEX", "18日締め", ".csv,text/csv", true)}
        ${tile("csv02", "card", "violet", "兼用AMEX", "20日締め・本人名義の分だけ会社の経費", ".csv,text/csv", true)}
        ${tile("csv03", "bank", "green", "法人口座の入出金", "前月末まで", ".csv,text/csv", true)}
        ${tile("csv04", "card", "orange", "法人デビット", "前月末まで", ".csv,text/csv", true)}
        <p class="result" style="margin:0 6px">同じ明細を二度入れても、重なった行は一度だけ数えます</p>
      </div>
      <div class="grid">
        <div class="group-h"><span>集計とルール</span></div>
        ${tile("sum", "file", "blue", "売上ダッシュボードの数字", `data.json・${counts.months}か月分${settings.summary_asof ? `（${esc(settings.summary_asof)} 時点）` : ""}`, ".json,application/json", false)}
        ${tile("rules", "tag", "violet", "科目のルール", `利用先 ${counts.merchants.toLocaleString()}件・口座 ${counts.bank}件`, ".json,application/json", false)}
        <div class="group-h"><span>目標</span></div>
        <div class="glass card">
          <div class="field-row">
            <label class="field"><span>第何期</span><input class="input num" id="tFy" inputmode="numeric" value="${esc(settings.target_fy || "")}"></label>
            <label class="field"><span>売上目標（税抜）</span><input class="input num" id="tSales" inputmode="numeric" value="${esc(settings.target_sales || "")}"></label>
          </div>
          <label class="field"><span>兼用AMEX の本人の名義</span><input class="input" id="owner" value="${esc(settings.owner_member || "")}" placeholder="カード明細の「ご利用者」の表記"></label>
          <button class="btn block" id="saveSet">保存</button>
        </div>
        <div class="group-h"><span>アカウント</span></div>
        <div class="glass list">
          <div class="row"><span class="main-t"><span class="ttl" style="display:block">${esc(u.name || "")}</span><span class="meta" style="display:block">${esc(u.email)}</span></span></div>
          <button class="row" id="logout" style="color:var(--red)">${icon("logout")}<span class="main-t">ログアウト</span></button>
        </div>
        <p class="foot-note version">REConos 経理 v${VERSION}${state.ai ? "" : "・AI 未接続"}</p>
      </div>
    </div>`;

  for (const src of ["01", "02", "03", "04"]) {
    $(`#csv${src}`).onchange = async (e) => {
      const out = $(`#csv${src}R`);
      let add = 0, read = 0, unk = 0;
      for (const f of e.target.files) {
        out.innerHTML = `<span class="shimmer-text">${esc(f.name)} を読んでいます…</span>`;
        try {
          const r = await api("/api/import/csv", { method: "POST", body: { src, text: await readText(f) } });
          add += r.added; read += r.read; unk += r.unknown;
        } catch (err) { out.textContent = `${f.name}: ${err.message}`; toast(err.message, true); e.target.value = ""; return; }
      }
      out.textContent = `${read}行を読み、新しく${add}行を入れました${unk ? `（科目が決まっていないもの ${unk}行）` : ""}`;
      toast(`${add}行を取り込みました`);
      e.target.value = "";
      refreshBadges();
    };
  }
  $("#sum").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const r = await api("/api/import/summary", { method: "POST", body: JSON.parse(await readText(f)) });
      $("#sumR").textContent = `${r.months}か月分を入れました（${r.asof || "日付なし"}${r.version ? `・${r.version}` : ""}）`;
      toast("集計を取り込みました");
    } catch (err) { toast(err instanceof SyntaxError ? "JSON の形ではありません" : err.message, true); }
    e.target.value = "";
  };
  $("#rules").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const r = await api("/api/import/rules", { method: "POST", body: JSON.parse(await readText(f)) });
      $("#rulesR").textContent = `利用先 ${r.merchants}件・口座 ${r.bank}件を入れ、${r.recategorized}行を振り分け直しました`;
      toast("ルールを取り込みました");
      refreshBadges();
    } catch (err) { toast(err instanceof SyntaxError ? "JSON の形ではありません" : err.message, true); }
    e.target.value = "";
  };
  $("#saveSet").onclick = async () => {
    await api("/api/settings", { method: "PUT", body: { target_fy: $("#tFy").value.trim(), target_sales: $("#tSales").value.replace(/[^\d]/g, ""), owner_member: $("#owner").value.trim() } });
    toast("保存しました");
  };
  $("#logout").onclick = async () => { await api("/auth/logout", { method: "POST" }); location.href = "/"; };
};

/* ---------- AI に聞く ---------- */

function openAi(first) {
  openSheet({
    title: "AI に聞く",
    html: `
      <div class="suggest">${["今期は目標に届くペース？", "前期より経費が増えた科目は？", "未入金はいくら？", "外注費の比率は？"].map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <div class="ai-log" id="log"></div>
      <div class="ai-input"><textarea class="textarea" id="q" rows="1" placeholder="数字について聞く"></textarea><button class="icon-btn accent" id="ask" aria-label="送る" style="width:48px;height:48px">${icon("send")}</button></div>`,
    onMount: (s) => {
      const log = $("#log", s.el);
      const q = $("#q", s.el);
      const ask = async (text) => {
        text = text.trim();
        if (!text) return;
        q.value = "";
        log.insertAdjacentHTML("beforeend", `<div class="bubble me">${esc(text)}</div><div class="bubble ai" id="pending"><span class="typing"><i></i><i></i><i></i></span></div>`);
        s.body.scrollTo({ top: s.body.scrollHeight, behavior: "smooth" });
        try {
          const r = await api("/api/ai/ask", { method: "POST", body: { question: text, fy: state.fy } });
          $("#pending", s.el).outerHTML = `<div class="bubble ai">${esc(r.answer)}</div>`;
        } catch (e) { $("#pending", s.el).outerHTML = `<div class="bubble ai" style="color:var(--red)">${esc(e.message)}</div>`; }
        s.body.scrollTo({ top: s.body.scrollHeight, behavior: "smooth" });
      };
      $$("[data-q]", s.el).forEach((b) => b.onclick = () => ask(b.dataset.q));
      $("#ask", s.el).onclick = () => ask(q.value);
      q.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(q.value); } });
      q.addEventListener("input", () => { q.style.height = "auto"; q.style.height = `${Math.min(140, q.scrollHeight)}px`; });
      if (first) ask(first);
      else setTimeout(() => q.focus(), 350);
    },
  });
}
