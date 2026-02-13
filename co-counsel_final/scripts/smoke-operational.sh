#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
CASE_ID="${CASE_ID:-default}"
OUT_DIR="${OUT_DIR:-logs/build_logs}"
AUTH_BEARER_TOKEN="${AUTH_BEARER_TOKEN:-}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_MD="${OUT_DIR}/smoke_report_${STAMP}.md"
REPORT_JSON="${OUT_DIR}/smoke_report_${STAMP}.json"

mkdir -p "${OUT_DIR}"

tmp_results="$(mktemp)"
trap 'rm -f "$tmp_results"' EXIT

check_json() {
  local label="$1"
  local method="$2"
  local path="$3"
  local required="$4"
  local auth_optional="$5"
  local payload="${6:-}"
  local url="${API_BASE_URL}${path}"
  local response
  local curl_args=(-sS -X "$method" "$url" -w $'\n%{http_code}')

  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    curl_args+=(-H "Authorization: Bearer ${AUTH_BEARER_TOKEN}")
  fi

  if [[ -n "$payload" ]]; then
    curl_args+=(-H 'Content-Type: application/json' -d "$payload")
    response="$(curl "${curl_args[@]}" || true)"
  else
    response="$(curl "${curl_args[@]}" || true)"
  fi

  local status
  status="$(printf '%s' "$response" | tail -n 1)"
  local body
  body="$(printf '%s' "$response" | sed '$d')"

  local ok="false"
  local soft_fail="false"
  if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
    ok="true"
  elif [[ "$status" == "401" && "$auth_optional" == "true" && -z "$AUTH_BEARER_TOKEN" ]]; then
    soft_fail="true"
  fi

  local body_one_line
  body_one_line="$(printf '%s' "$body" | tr '\n' ' ')"
  local body_preview="${body_one_line:0:220}"
  printf '{"label":"%s","method":"%s","path":"%s","status":"%s","ok":%s,"required":%s,"soft_fail":%s,"body_preview":"%s"}\n' \
    "$label" "$method" "$path" "$status" "$ok" "$required" "$soft_fail" "$(printf '%s' "$body_preview" | sed 's/"/\\"/g')" >> "$tmp_results"
}

check_json "API health" "GET" "/health" "true" "false"
check_json "Parity matrix" "GET" "/parity/matrix" "true" "false"
check_json "Legacy workflows" "GET" "/parity/legacy-workflows" "true" "false"
check_json "Run legacy workflow" "POST" "/parity/legacy-workflows/run" "true" "false" "{\"case_id\":\"${CASE_ID}\",\"workflow_id\":\"deposition_prep\",\"prompt\":\"smoke test\"}"
check_json "Voice TTS" "POST" "/voice/tts" "true" "false" "{\"text\":\"Operational smoke check\",\"voice\":\"en-us/mary_ann-glow_tts\"}"
check_json "Query endpoint" "GET" "/query?q=smoke+test+citations" "false" "true"
check_json "Timeline endpoint" "GET" "/timeline?case_id=${CASE_ID}" "false" "true"
check_json "Court sync status" "GET" "/courts/sync/status?case_id=${CASE_ID}" "true" "false"

total="$(wc -l < "$tmp_results" | tr -d ' ')"
passed_required=0
failed_required=0
soft_failed=0

while IFS= read -r line; do
  ok="$(printf '%s' "$line" | sed -n 's/.*"ok":\([^,}]*\).*/\1/p')"
  required="$(printf '%s' "$line" | sed -n 's/.*"required":\([^,}]*\).*/\1/p')"
  soft_fail="$(printf '%s' "$line" | sed -n 's/.*"soft_fail":\([^,}]*\).*/\1/p')"
  if [[ "$soft_fail" == "true" ]]; then
    soft_failed=$((soft_failed + 1))
  fi
  if [[ "$required" == "true" ]]; then
    if [[ "$ok" == "true" ]]; then
      passed_required=$((passed_required + 1))
    else
      failed_required=$((failed_required + 1))
    fi
  fi
done < "$tmp_results"

{
  echo "# Operational Smoke Report"
  echo
  echo "- Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "- API Base: \`${API_BASE_URL}\`"
  echo "- Case ID: \`${CASE_ID}\`"
  echo "- Required checks passed: ${passed_required}"
  echo "- Required checks failed: ${failed_required}"
  echo "- Auth-gated soft failures: ${soft_failed}"
  echo "- Total checks: ${total}"
  if [[ -n "$AUTH_BEARER_TOKEN" ]]; then
    echo "- Auth token: provided"
  else
    echo "- Auth token: not provided"
  fi
  echo
  echo "## Checks"
  while IFS= read -r line; do
    label="$(printf '%s' "$line" | sed -n 's/.*"label":"\([^"]*\)".*/\1/p')"
    method="$(printf '%s' "$line" | sed -n 's/.*"method":"\([^"]*\)".*/\1/p')"
    path="$(printf '%s' "$line" | sed -n 's/.*"path":"\([^"]*\)".*/\1/p')"
    status="$(printf '%s' "$line" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
    ok="$(printf '%s' "$line" | sed -n 's/.*"ok":\([^,}]*\).*/\1/p')"
    required="$(printf '%s' "$line" | sed -n 's/.*"required":\([^,}]*\).*/\1/p')"
    soft_fail="$(printf '%s' "$line" | sed -n 's/.*"soft_fail":\([^,}]*\).*/\1/p')"
    preview="$(printf '%s' "$line" | sed -n 's/.*"body_preview":"\([^"]*\)".*/\1/p')"
    marker="FAIL"
    if [[ "$ok" == "true" ]]; then
      marker="PASS"
    elif [[ "$soft_fail" == "true" ]]; then
      marker="SOFT"
    fi
    echo "- [${marker}] \`${method} ${path}\` (\`${status}\`) - ${label} | required=${required}"
    echo "  - Preview: ${preview}"
  done < "$tmp_results"
} > "$REPORT_MD"

{
  echo "["
  paste -sd "," "$tmp_results"
  echo "]"
} > "$REPORT_JSON"

echo "Smoke run complete."
echo "Markdown report: ${REPORT_MD}"
echo "JSON report: ${REPORT_JSON}"
if [[ "$failed_required" -gt 0 ]]; then
  echo "One or more required checks failed (${failed_required})."
  exit 1
fi
