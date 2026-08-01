#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Post-deploy verification for the VanguardOS Wave 2 positioning pass.
#
#   ./qa/verify-deploy.sh                      # checks https://vanguardos.co
#   ./qa/verify-deploy.sh https://xxxx.pages.dev   # checks a preview URL
#
# Exits non-zero if any check fails. Run this BEFORE handing off to Codex for
# Meta Ads MCP image ingestion — the MCP can only ingest public image URLs.
# ---------------------------------------------------------------------------
set -uo pipefail

BASE="${1:-https://vanguardos.co}"
BASE="${BASE%/}"
FAIL=0
pass() { printf "  \033[32mPASS\033[0m  %s\n" "$1"; }
fail() { printf "  \033[31mFAIL\033[0m  %s\n" "$1"; FAIL=1; }

echo
echo "Verifying $BASE"
echo

# ── 1. The 18 Wave 2 ad images ────────────────────────────────────────────
echo "1. Wave 2 ad images (18 direct URLs)"
OK=0
for pair in "b01 b01-2am-scroll" "b02 b02-decision-velocity" "b03 b03-built-because-drowning"; do
  set -- $pair
  for i in 1 2 3 4 5 6; do
    URL="$BASE/meta/wave2/2026-07-26/$1/$2-s$i.png"
    read -r CODE CTYPE SIZE <<<"$(curl -sIL -o /dev/null -w '%{http_code} %{content_type} %{size_download}' "$URL")"
    if [ "$CODE" = "200" ] && [[ "$CTYPE" == image/png* ]]; then
      OK=$((OK + 1))
    else
      fail "$URL -> $CODE $CTYPE"
    fi
  done
done
[ "$OK" -eq 18 ] && pass "all 18 PNGs return 200 with Content-Type: image/png"

# Spot-check that one image is really 1080x1080 and not an HTML error page.
TMP=$(mktemp)
curl -sL "$BASE/meta/wave2/2026-07-26/b01/b01-2am-scroll-s1.png" -o "$TMP"
DIMS=$(python3 - "$TMP" <<'PY'
import struct, sys
d = open(sys.argv[1], 'rb').read(33)
print("notpng" if d[:8] != b'\x89PNG\r\n\x1a\n' else "%dx%d" % struct.unpack('>II', d[16:24]))
PY
)
[ "$DIMS" = "1080x1080" ] && pass "b01-s1 is a real 1080x1080 PNG" || fail "b01-s1 is $DIMS"
rm -f "$TMP"

# ── 2. Landing page copy ──────────────────────────────────────────────────
echo
echo "2. Landing page copy"
HTML=$(curl -sL "$BASE/")
[ -n "$HTML" ] || { fail "could not fetch $BASE/"; echo; exit 1; }

BANNED=(
  "complete beginner"
  "Turn one unfinished idea into a branded digital product"
  "Five stars, from people"
  "Every one of them started"
  "That's the whole promise, proven real"
  "\$811"
  "nearly five times"
  'data-event="initiate_checkout"'
  "Live checkout, confirmed"
)
BAD=0
for p in "${BANNED[@]}"; do
  if grep -Fq "$p" <<<"$HTML"; then fail "retired phrase still live: \"$p\""; BAD=1; fi
done
[ "$BAD" -eq 0 ] && pass "all 8 retired phrases absent"

REQUIRED=(
  "Build or refine your digital product"
  "Start with no idea, an unfinished idea, or a product that already exists"
  "I already have a digital product. Will this still work for me?"
  "Day 5 output: a checkout ready to publish"
  "What the system helped them"
  "Three firsthand accounts"
  "What you need to move from idea"
  "Nothing is sold as a shortcut"
  "Pick the idea you are tired of carrying"
  "Give it five ordered days"
  "We would rather help you finish"
)
MISS=0
for p in "${REQUIRED[@]}"; do
  if ! grep -Fq "$p" <<<"$HTML"; then fail "new copy missing: \"$p\""; MISS=1; fi
done
[ "$MISS" -eq 0 ] && pass "all new copy present"

# $129 should appear 6x: 5 visible locations + 1 mirrored in the FAQ JSON-LD.
N=$(grep -o '\$129' <<<"$HTML" | wc -l | tr -d ' ')
[ "$N" -eq 6 ] && pass "\$129 appears 6x (5 visible + FAQ structured data)" \
               || fail "\$129 appears ${N}x, expected 6"

# ── 3. CTAs ───────────────────────────────────────────────────────────────
echo
echo "3. CTAs"
CTAS=$(grep -o 'data-event="[a-z_]*"' <<<"$HTML" | sort -u | tr '\n' ' ')
[ "$(tr -d ' ' <<<"$CTAS")" = 'data-event="checkout_click"' ] \
  && pass "every CTA labelled checkout_click" \
  || fail "unexpected data-event values: $CTAS"

LINKS=$(grep -o 'https://vanguardos.gumroad.com/l/lgaxz?wanted=true' <<<"$HTML" | wc -l | tr -d ' ')
[ "$LINKS" -ge 4 ] && pass "$LINKS Gumroad CTAs point at l/lgaxz" \
                   || fail "only $LINKS Gumroad links found"

# ── 4. Meta Pixel contract ────────────────────────────────────────────────
echo
echo "4. Meta Pixel"
PV=$(grep -o "fbq('track', 'PageView'" <<<"$HTML" | wc -l | tr -d ' ')
VC=$(grep -o "fbq('track', 'ViewContent'" <<<"$HTML" | wc -l | tr -d ' ')
[ "$PV" -eq 1 ] && pass "PageView fires once"   || fail "PageView fires ${PV}x"
[ "$VC" -eq 1 ] && pass "ViewContent fires once" || fail "ViewContent fires ${VC}x"
grep -q "fbq('track', 'Purchase'" <<<"$HTML" \
  && fail "Purchase must not fire on the landing page" \
  || pass "no Purchase event"
grep -q "fbq('track', 'InitiateCheckout'" <<<"$HTML" \
  && fail "InitiateCheckout must not fire on the landing page" \
  || pass "no InitiateCheckout event"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "  ALL CHECKS PASSED — safe to hand off to Codex / Meta Ads MCP."
else
  echo "  ONE OR MORE CHECKS FAILED — do not hand off yet."
fi
echo
exit "$FAIL"
