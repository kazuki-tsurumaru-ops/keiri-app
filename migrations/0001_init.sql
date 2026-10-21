CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT,
  picture TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- 発行する請求書。status: requested(作成待ち) → draft(INVOY で作成済み) → ready(メール下書き済み・送付待ち) → sent(請求済) → paid(入金済) / canceled
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,           -- 税抜
  tax INTEGER NOT NULL DEFAULT 0,
  withholding INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,            -- 請求額（税込・源泉後）
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested',
  send_via TEXT NOT NULL DEFAULT 'mail',
  drive_url TEXT NOT NULL DEFAULT '',
  request_text TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  paid_date TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoices_issue ON invoices(issue_date DESC);

-- 外注先から届いた請求書。ym は請求書に書かれた「何月分」
CREATE TABLE IF NOT EXISTS vendor_bills (
  id TEXT PRIMARY KEY,
  vendor TEXT NOT NULL,
  ym TEXT NOT NULL,
  amount INTEGER NOT NULL,           -- 税抜の本体
  drive_url TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vendor_ym ON vendor_bills(ym DESC);

-- カード・口座の明細。src: 01 法人AMEX / 02 兼用AMEX / 03 法人口座 / 04 法人デビット
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,               -- 明細の行から作る印（同じ行を二重に入れない）
  src TEXT NOT NULL,
  date TEXT NOT NULL,
  ym TEXT NOT NULL,
  descr TEXT NOT NULL,
  member TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,    -- 出ていったお金
  inflow REAL NOT NULL DEFAULT 0,    -- 入ってきたお金（口座のみ）
  fee REAL NOT NULL DEFAULT 0,
  rule_key TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  manual INTEGER NOT NULL DEFAULT 0, -- 手で科目を決めた行
  ai_suggest TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_ym ON transactions(ym DESC, src);
CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category);

-- 利用先ごとの科目（カード・デビット）
CREATE TABLE IF NOT EXISTS merchant_rules (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  personal02 INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 法人口座の出金のルール（上から順に当てる）
CREATE TABLE IF NOT EXISTS bank_rules (
  ord INTEGER PRIMARY KEY,
  pattern TEXT NOT NULL,
  category TEXT                       -- NULL は数えない行
);

-- 取り込んだ月ごとの集計（売上ダッシュボードの数字.json）
CREATE TABLE IF NOT EXISTS monthly (
  ym TEXT PRIMARY KEY,
  sales INTEGER,
  sales_n INTEGER,
  out INTEGER,
  out_n INTEGER,
  exp TEXT NOT NULL DEFAULT '{}',
  exp_unk INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
