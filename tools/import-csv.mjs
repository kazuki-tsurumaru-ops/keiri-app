// Mac の経理フォルダにあるカード・口座の CSV を、アプリと同じ振り分け方で D1 に入れるための SQL を作る。
// 行の印（id）はアプリの取り込みと同じ作り方なので、あとでアプリから同じ CSV を入れても二重にならない。
// 使い方: node tools/import-csv.mjs > private/import.sql
//         npx wrangler d1 execute keiri-app --remote --file private/import.sql
// 出力には明細（利用先・金額）が入るので private/（GitHub に上げない）に置き、使い終わったら消す。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { webcrypto as crypto } from "node:crypto";
import { parseStatement, categorize, payeeHash } from "../src/ledger.js";

const KEIRI = join(homedir(), "Library/CloudStorage/GoogleDrive-kazuki-tsurumaru@reconosinc.com/共有ドライブ/REConos Inc.プロジェクト/経理");
const DIRS = { "01": ["01_法人AMEX"], "02": ["02_個人-法人_AMEX"], "03": ["03_法人口座入出金"], "04": ["04_法人デビット", "第3期/デビットカード3期"] };
const rulesFile = JSON.parse(readFileSync(new URL("../private/rules.json", import.meta.url), "utf8"));
const rules = {
  merchants: new Map(Object.entries(rulesFile.merchant_map).map(([k, v]) => [k, [v[0], !!v[1]]])),
  bank: rulesFile.bank_rules.map(([pattern, category]) => ({ pattern, category })),
  owner: rulesFile.owner_member || "",
};

const decode = (buf) => {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { return new TextDecoder("shift_jis").decode(buf); }
};
const sha = async (s) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
};
const q = (v) => (typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const now = Date.now();
const ids = new Set();
const out = [];
const stat = {};
for (const [src, dirs] of Object.entries(DIRS)) {
  stat[src] = { files: 0, rows: 0, unknown: 0, first: "9999", last: "0000" };
  for (const dir of dirs) {
    const p = join(KEIRI, dir);
    if (!existsSync(p)) continue;
    for (const f of readdirSync(p).filter((f) => f.toLowerCase().endsWith(".csv") && !f.startsWith("._")).sort()) {
      const rows = parseStatement(src, decode(readFileSync(join(p, f))));
      stat[src].files++;
      const seen = new Map();
      for (const r of rows) {
        const base = [src, r.date, r.descr, r.member, r.amount, r.inflow].join("|");
        const n = (seen.get(base) || 0) + 1; // 同じファイル内の同じ行は別の行
        seen.set(base, n);
        const id = await sha(`${base}|${n}`);
        if (ids.has(id)) continue; // 別のファイルと重なった行は一度だけ
        if (src === "03") r.payee = await payeeHash(r.descr);
        const { category, key } = categorize(src, r, rules);
        if (category === null) continue;
        ids.add(id);
        stat[src].rows++;
        if (category === "要確認") stat[src].unknown++;
        if (r.date < stat[src].first) stat[src].first = r.date;
        if (r.date > stat[src].last) stat[src].last = r.date;
        out.push(`INSERT INTO transactions (id, src, date, ym, descr, member, amount, inflow, fee, rule_key, category, created_at) VALUES (${[id, src, r.date, r.date.slice(0, 7), r.descr, r.member, r.amount, r.inflow, r.fee, key, category, now].map(q).join(", ")}) ON CONFLICT(id) DO NOTHING;`);
      }
    }
  }
}
console.log(out.join("\n"));
// 件数だけを画面に出す（明細の中身は出さない）
for (const [s, v] of Object.entries(stat)) console.error(`${s}: ${v.files}ファイル ${v.rows}行（${v.first}〜${v.last}） 科目未定 ${v.unknown}行`);
