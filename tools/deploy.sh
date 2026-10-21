#!/bin/zsh
# 本番公開（初回）。ログインの ID・Mac 連携の鍵を入れ、Google のクライアントシークレットを聞いてから公開する。
# 使い方: zsh tools/deploy.sh
set -e
cd "${0:A:h}/.."
printf '%s' "1085803713968-8ge4ccget4v4caji0717u0m9g75omhde.apps.googleusercontent.com" | npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put AGENT_TOKEN < private/agent_token
echo ""
echo "Google Cloud で出したクライアントシークレットを貼り付けて Enter（画面には出ません）"
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler deploy
