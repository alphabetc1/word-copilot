#!/usr/bin/env bash
set -euo pipefail

DEFAULT_MANIFEST_URL="https://alphabetc1.github.io/word-copilot/word-copilot.xml"
FALLBACK_MANIFEST_URLS=(
  "https://raw.githubusercontent.com/alphabetc1/word-copilot/main/word-copilot.xml"
)
manifest_url="$DEFAULT_MANIFEST_URL"
manifest_path=""
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/install-sideload-mac.sh
  bash scripts/install-sideload-mac.sh --manifest /path/to/word-copilot.xml
  bash scripts/install-sideload-mac.sh --manifest-url https://example.com/word-copilot.xml
EOF
}

resolve_local_manifest() {
  local candidates=(
    "$script_dir/../word-copilot.xml"
    "$(pwd)/word-copilot.xml"
  )

  local candidate=""
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

download_manifest() {
  local destination="$1"
  local url=""
  local urls=("$manifest_url" "${FALLBACK_MANIFEST_URLS[@]}")

  for url in "${urls[@]}"; do
    echo "Downloading manifest from: $url"
    if curl -fsSL --connect-timeout 15 --max-time 60 "$url" -o "$destination"; then
      return 0
    fi
    echo "Download failed: $url" >&2
  done

  echo "Failed to download manifest from all known URLs." >&2
  echo "Tip: if you already cloned the repo, run:" >&2
  echo "  bash scripts/install-sideload-mac.sh --manifest ./word-copilot.xml" >&2
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --manifest" >&2
        exit 1
      fi
      manifest_path="$2"
      shift 2
      ;;
    --manifest-url)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --manifest-url" >&2
        exit 1
      fi
      manifest_url="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer is for macOS only." >&2
  exit 1
fi

if [[ -z "$manifest_path" ]] && ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to download the manifest." >&2
  exit 1
fi

wef_dir="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
dest_path="$wef_dir/word-copilot.xml"
tmp_manifest="$(mktemp "${TMPDIR:-/tmp}/word-copilot.XXXXXX.xml")"

cleanup() {
  rm -f "$tmp_manifest"
}
trap cleanup EXIT

if [[ -n "$manifest_path" ]]; then
  if [[ ! -f "$manifest_path" ]]; then
    echo "Manifest not found: $manifest_path" >&2
    exit 1
  fi
  cp "$manifest_path" "$tmp_manifest"
elif local_manifest="$(resolve_local_manifest)"; then
  echo "Using local manifest: $local_manifest"
  cp "$local_manifest" "$tmp_manifest"
else
  download_manifest "$tmp_manifest"
fi

if ! grep -q "<OfficeApp" "$tmp_manifest"; then
  echo "The manifest file is invalid or incomplete." >&2
  exit 1
fi

mkdir -p "$wef_dir"
cp "$tmp_manifest" "$dest_path"

echo "Installed manifest to: $dest_path"
if pgrep -x "Microsoft Word" >/dev/null 2>&1; then
  echo "Word is running. Quit Word completely (Cmd+Q) and reopen it to load the add-in."
else
  echo "Open Word and look for 'Word Copilot' in the ribbon or right-click menu."
fi
