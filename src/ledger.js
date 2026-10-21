// カード・口座の明細（CSV）を読み、科目に振り分ける。
// 利用先ごとの科目（merchant_rules）と口座のルール（bank_rules）はデータベースに置き、ここには書かない。

// 経費として数える科目（並びは売上・外注費シートの「経費合計（科目別）」と同じ）
export const EXP_CATS = [
  "旅費交通費", "接待交際費", "会議費", "通信費", "ソフト・サブスク", "消耗品費・機材", "撮影経費", "広告宣伝費", "地代家賃",
  "水道光熱費", "支払手数料", "支払報酬", "新聞図書費", "研修費", "諸会費", "租税公課", "保険料", "雑費",
  "エポスカード（明細なし）", "現金払いの経費（明細なし）", "naru. の商品製造",
];
// 中身の分からないもの（経費の合計とは別に出す）
export const UNK_CATS = ["電子マネー払い（店名なし）", "要確認"];
// それ以外の科目（私用・税金・役員への支払い・貸付金・借入金の返済・口座からの外注費）は経費に入れない

export const SOURCES = {
  "01": "法人AMEX",
  "02": "兼用AMEX",
  "03": "法人口座",
  "04": "法人デビット",
};

/* ---------- CSV ---------- */

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  const t = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const num = (s) => {
  const v = String(s ?? "").replace(/[,"\s]/g, "");
  return v === "" || v === "-" ? 0 : Number(v) || 0;
};
const norm = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
const day = (s) => String(s ?? "").trim().replace(/\//g, "-").replace(/-(\d)(?!\d)/g, "-0$1");

// 明細の種類ごとの列の並び
export function parseStatement(src, text) {
  const rows = parseCsv(text);
  if (src === "01" || src === "02") {
    if (!rows.length || !String(rows[0][0] || "").includes("ご利用日")) return [];
    return rows.slice(1).filter((r) => r.length >= 6 && r[0]).map((r) => ({
      date: day(r[0]), descr: norm(r[2]), member: String(r[3] || "").trim(), amount: num(r[5]), inflow: 0, fee: 0,
    })).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  }
  if (src === "03") {
    return rows.slice(1).filter((r) => r.length >= 5 && r[0]).map((r) => ({
      date: day(r[0]), descr: norm(r[1]), member: "", amount: num(r[2]), inflow: num(r[3]), fee: 0,
    })).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  }
  if (src === "04") {
    return rows.slice(1).filter((r) => r.length >= 8 && r[0] === "2").map((r) => ({
      date: day(r[1]), descr: norm(r[2]), member: "", amount: num(r[4]), inflow: 0, fee: num(r[5]) + num(r[6]) + num(r[7]),
    })).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  }
  return [];
}

/* ---------- 振り分け ---------- */

const SKIP = /お支払いありがとう|前回分口座振替|一括払いからの変更|元本分ご請求額|口座振替ができ|分割払い利用分|あとリボ利用分/;
const FEE = /年会費|ペイフレックス手数料|遅延損害金|発行手数料/;
const TAX = /消費税|法人税|地方法人税|事業税|住民税/;
const EMONEY = /クイックペイ|nanaco|ナナコ|AmazonPay提携|Apple Pay チャ|アツプルペイ/;
const PERSON = /^振込\*[ァ-ヴー]+ ?[ァ-ヴー]+$/;
const ATM = /^ATM(?!手数料)/;

// 利用先の名前から、店舗番号・地名などを外した「科目表の見出し」を作る
export function merchantKey(d) {
  let s = String(d).replace(/[?？]/g, " ");
  s = s.replace(/\s+(東京都|大阪府|北海道|京都府|..県|...県).*$/, "");
  s = s.replace(/[(（][0-9#]+[)）]/g, "");
  s = s.replace(/\d{3,}/g, "");
  return s.trim().slice(0, 28);
}

function cardCategory(src, d, member, rules) {
  if (src === "02" && rules.owner && member && member !== rules.owner) return "私用（兼用カード）";
  if (FEE.test(d)) return "支払手数料";
  if (TAX.test(d)) return "税金（法人税・消費税）";
  if (EMONEY.test(d)) return "電子マネー払い（店名なし）";
  const hit = rules.merchants.get(merchantKey(d));
  if (!hit) return "要確認";
  const [c, personal02] = hit;
  if (src === "02" && (c === "私用" || personal02)) return "私用（兼用カード）";
  if (c === "私用") return "私用（法人カード・デビット）";
  return c;
}

function bankCategory(d, rules, payee) {
  for (const r of rules.bank) {
    // 「sha256:…」は振込先の名前を書かずに当てるルール（振込先から「振込*」と空白を除いた文字の SHA-256）
    if (r.pattern.startsWith("sha256:")) { if (payee && r.pattern.slice(7) === payee) return r.category; continue; }
    try {
      if (new RegExp(r.pattern).test(d)) return r.category; // null は数えない行
    } catch { /* 書き方の誤ったルールは飛ばす */ }
  }
  if (/^デビット|差額調整\*デビット/.test(d)) return "デビット";
  if (/アメリカンエキスプレス/.test(d)) return null;
  if (/振込手数料|ATM手数料|組戻手数料|事務取扱手数料/.test(d)) return "支払手数料";
  if (/国税/.test(d)) return "租税公課";
  if (PERSON.test(d) || d.includes("ダイヒヨウ")) return "外注費（口座からの支払い）";
  return "要確認";
}

// 戻り値の category が null の行は取り込まない（カードの支払い・口座の入金で数えないもの）
export function categorize(src, r, rules) {
  const d = r.descr;
  if (src === "01" || src === "02" || src === "04") {
    if (SKIP.test(d)) return { category: null, key: "" };
    return { category: cardCategory(src === "04" ? "04" : src, d, r.member, rules), key: merchantKey(d) };
  }
  // 法人口座
  if (ATM.test(d)) return { category: "現金払いの経費（明細なし）", key: "" }; // 引き出した現金は現金払いの経費。戻した入金は下で差し引く
  if (r.amount > 0) {
    const c = bankCategory(d, rules, r.payee);
    if (c === "デビット") {
      return { category: r.date.slice(0, 7) >= "2025-07" ? null : "要確認", key: "" }; // 2025年7月からは 04 の明細で数える
    }
    return { category: c, key: "" };
  }
  if (r.inflow > 0) return { category: "入金", key: "" };
  return { category: null, key: "" };
}

export async function payeeHash(descr) {
  const s = String(descr).replaceAll("振込*", "").replace(/\s/g, "");
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
