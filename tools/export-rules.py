#!/usr/bin/env python3
# 005_請求書 の科目ルール（merchant_map.json と expense_update.py の口座ルール）を、
# アプリの「その他 → 科目のルール」で取り込める1つのファイルにまとめる。
# 出力は private/rules.json（GitHub に上げないフォルダ）。中身には利用先の名前が入るので、外へ出さない。
# 使い方: python3 -I tools/export-rules.py
import ast, json, pathlib

HERE = pathlib.Path(__file__).resolve().parent.parent
SHEET = HERE.parent / '005_請求書' / 'scripts' / 'sheet'
src = (SHEET / 'expense_update.py').read_text(encoding='utf-8')
tree = ast.parse(src)
vals = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        name = node.targets[0].id
        if name in ('BANK', 'PAYEE', 'OWNER'):
            vals[name] = ast.literal_eval(node.value)

bank = [[p, c] for p, c in vals['BANK']]
# 名前を書かない振込先のルールは先頭に置く（前回の仕組みでも最初に当てていた）
bank = [[f'sha256:{h}', c] for h, c in vals.get('PAYEE', {}).items()] + bank
out = {
    'merchant_map': json.loads((SHEET / 'merchant_map.json').read_text(encoding='utf-8')),
    'bank_rules': bank,
    'owner_member': vals.get('OWNER', ''),
}
dst = HERE / 'private' / 'rules.json'
dst.parent.mkdir(exist_ok=True)
dst.write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
print(f"{dst}: 利用先 {len(out['merchant_map'])}件・口座 {len(bank)}件")
