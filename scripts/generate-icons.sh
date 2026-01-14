#!/usr/bin/env bash
set -euo pipefail

SRC="public/icon.svg"
OUT_DIR="public/icon"
SIZES=(16 32 48 96 128)

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "Error: rsvg-convert not found. Install with: brew install librsvg" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

for size in "${SIZES[@]}"; do
  rsvg-convert -w "$size" -h "$size" "$SRC" -o "$OUT_DIR/$size.png"
done

echo "Generated icons: ${SIZES[*]} -> $OUT_DIR"
