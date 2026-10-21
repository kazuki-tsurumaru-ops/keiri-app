// 手元の画面確認用の架空データを作る（実在の取引先・金額ではない）。
// 使い方: node tools/demo-seed.mjs > .wrangler/demo.sql && npx wrangler d1 execute keiri-app --local -c wrangler.local.toml --file .wrangler/demo.sql
const q = (s) => (s === null ? "NULL" : typeof s === "number" ? String(s) : `'${String(s).replace(/'/g, "''")}'`);
const out = [];
const now = Date.now();
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const CATS = ["旅費交通費", "接待交際費", "会議費", "通信費", "ソフト・サブスク", "消耗品費・機材", "撮影経費", "地代家賃", "支払手数料"];
out.push("DELETE FROM monthly; DELETE FROM invoices; DELETE FROM vendor_bills; DELETE FROM transactions; DELETE FROM settings;");
const months = [];
for (let y = 2025, m = 7; !(y === 2026 && m === 10); m === 12 ? (y++, (m = 1)) : m++) months.push(`${y}-${String(m).padStart(2, "0")}`);
for (const ym of months) {
  const sales = Math.round((2600000 + rnd() * 2800000) / 1000) * 1000;
  const out_ = Math.round(sales * (0.2 + rnd() * 0.15));
  const exp = {};
  for (const c of CATS) exp[c] = Math.round(20000 + rnd() * (c === "地代家賃" ? 0 : 180000)) + (c === "地代家賃" ? 160000 : 0);
  out.push(`INSERT INTO monthly (ym, sales, sales_n, out, out_n, exp, exp_unk, updated_at) VALUES (${q(ym)}, ${sales}, ${5 + Math.floor(rnd() * 8)}, ${out_}, ${3 + Math.floor(rnd() * 6)}, ${q(JSON.stringify(exp))}, ${Math.round(rnd() * 30000)}, ${now});`);
}
out.push(`INSERT INTO settings (key, value) VALUES ('target_fy','4'),('target_sales','48000000'),('summary_asof','2026-10-12'),('summary_version','demo'),('owner_member','DEMO TARO');`);
const inv = [
  ["株式会社サンプル映像", "10月度 映像制作費", 250000, "2026-10-01", "requested", "mail"],
  ["合同会社テストスタジオ", "撮影・編集一式", 480000, "2026-10-05", "draft", "mail"],
  ["株式会社デモ商事", "10月度 SNS動画", 180000, "2026-10-10", "ready", "line"],
  ["株式会社サンプル映像", "9月度 映像制作費", 250000, "2026-09-30", "sent", "mail"],
  ["有限会社ためし企画", "PV制作", 820000, "2026-09-20", "sent", "mail"],
  ["株式会社デモ商事", "9月度 SNS動画", 180000, "2026-09-10", "paid", "line"],
];
inv.forEach(([client, title, amount, issue, status, via], i) => {
  const tax = Math.floor(amount * 0.1);
  const [y, m] = issue.split("-").map(Number);
  const due = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
  out.push(`INSERT INTO invoices (id, number, client, title, amount, tax, withholding, total, issue_date, due_date, status, send_via, drive_url, request_text, note, paid_date, created_by, created_at, updated_at) VALUES (${q("demo" + i)}, ${q(status === "requested" ? "" : `DEMO-${100 + i}`)}, ${q(client)}, ${q(title)}, ${amount}, ${tax}, 0, ${amount + tax}, ${q(issue)}, ${q(due)}, ${q(status)}, ${q(via)}, '', '', '', ${q(status === "paid" ? "2026-09-30" : "")}, 'dev@localhost', ${now - i * 1000}, ${now});`);
});
[["山田（架空）", "2026-09", 120000], ["スタジオ架空", "2026-09", 85000], ["山田（架空）", "2026-10", 140000]].forEach(([v, ym, a], i) =>
  out.push(`INSERT INTO vendor_bills (id, vendor, ym, amount, drive_url, note, created_at) VALUES (${q("dv" + i)}, ${q(v)}, ${q(ym)}, ${a}, '', '撮影補助', ${now});`));
const tx = [
  ["01", "2026-10-02", "ADOBE ×××", 7780, "ソフト・サブスク"],
  ["01", "2026-10-03", "タクシー（架空）", 3200, "旅費交通費"],
  ["01", "2026-10-06", "カフェ（架空） 渋谷店", 1450, "会議費"],
  ["02", "2026-10-07", "家電量販店（架空）", 32800, "要確認"],
  ["04", "2026-10-08", "撮影スタジオ（架空）", 55000, "撮影経費"],
  ["04", "2026-10-09", "ネットショップ（架空）", 12980, "要確認"],
  ["03", "2026-10-10", "振込手数料", 440, "支払手数料"],
  ["01", "2026-10-11", "レストラン（架空）", 18600, "要確認"],
];
tx.forEach(([src, date, d, a, c], i) => out.push(`INSERT INTO transactions (id, src, date, ym, descr, member, amount, inflow, fee, rule_key, category, created_at) VALUES (${q("dt" + i)}, ${q(src)}, ${q(date)}, ${q(date.slice(0, 7))}, ${q(d)}, ${q(src === "02" ? "DEMO TARO" : "")}, ${a}, 0, 0, ${q(src === "03" ? "" : d)}, ${q(c)}, ${now});`));
out.push(`INSERT INTO transactions (id, src, date, ym, descr, member, amount, inflow, fee, rule_key, category, created_at) VALUES ('dt-in', '03', '2026-10-15', '2026-10', '振込 ユウゲンガイシヤタメシキカク', '', 0, 902000, 0, '', '入金', ${now});`);
console.log(out.join("\n"));
