#!/bin/sh
# Tells the search engines that take IndexNow (Bing, Yandex, Seznam, Naver, Yep) that the pages changed,
# so they crawl it again within hours. Bing's index also feeds ChatGPT search and Microsoft Copilot.
# Google doesn't take IndexNow: it reads docs/sitemap.xml, once the sitemap is submitted in Search Console.
# Run it after a push that changes the page, once clinamenco.com serves the site: sh tools/indexnow.sh
set -eu
host=clinamenco.com
docs=$(dirname "$0")/../docs
key=$(ls "$docs" | sed -n 's/^\([0-9a-f]\{32\}\)\.txt$/\1/p' | head -1)
[ -n "$key" ] || { echo "no IndexNow key file (32 hex characters + .txt) in docs/" >&2; exit 1; }
if [ "$(curl -fsSL "https://$host/$key.txt" 2>/dev/null)" != "$key" ]; then
  echo "https://$host/$key.txt doesn't serve the key yet: is $host pointing at GitHub Pages?" >&2
  exit 1
fi
# Every page in the sitemap, each page's Markdown twin, and llms.txt.
pages=$(sed -n 's|.*<loc>\(https://[^<]*\)</loc>.*|\1|p' "$docs/sitemap.xml")
[ -n "$pages" ] || { echo "no <loc> in docs/sitemap.xml" >&2; exit 1; }
urls=$(for p in $pages; do printf '"%s","%sindex.html.md",' "$p" "$p"; done)"\"https://$host/llms.txt\""
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"$host\",\"key\":\"$key\",\"keyLocation\":\"https://$host/$key.txt\",\"urlList\":[$urls]}")
case $code in
  200|202) echo "IndexNow took the URLs ($code)" ;;
  *) echo "IndexNow answered $code" >&2; exit 1 ;;
esac
