# E:\projects\op_veritas_2\Start-CoCounsel.ps1
$ErrorActionPreference = 'Stop'

# --- Paths ---------------------------------------------------------------
$RepoRoot    = "E:\projects\op_veritas_2"
$VenvPath    = Join-Path $RepoRoot "venv"
$BackendDir  = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$LogsDir     = Join-Path $RepoRoot "run_logs"
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

# --- Quick sanity checks -------------------------------------------------
if (!(Test-Path $RepoRoot))   { throw "Repo root not found: $RepoRoot" }
if (!(Test-Path $BackendDir)) { throw "Backend dir missing: $BackendDir" }
if (!(Test-Path $FrontendDir)){ throw "Frontend dir missing: $FrontendDir" }
if (!(Test-Path (Join-Path $VenvPath "Scripts\Activate.ps1"))) {
  throw "Python venv not found: $VenvPath. Create it first with:  py -3.12 -m venv `"$VenvPath`""
}

# --- Activate venv -------------------------------------------------------
& (Join-Path $VenvPath "Scripts\Activate.ps1")

# --- Helpful environment defaults (PS5-safe) -----------------------------
if (-not $env:MODEL_PROVIDERS_PRIMARY  -or [string]::IsNullOrWhiteSpace($env:MODEL_PROVIDERS_PRIMARY))   { $env:MODEL_PROVIDERS_PRIMARY   = "gemini" }
if (-not $env:MODEL_PROVIDERS_SECONDARY -or [string]::IsNullOrWhiteSpace($env:MODEL_PROVIDERS_SECONDARY)){ $env:MODEL_PROVIDERS_SECONDARY = "openai" }
if (-not $env:DEFAULT_CHAT_MODEL       -or [string]::IsNullOrWhiteSpace($env:DEFAULT_CHAT_MODEL))        { $env:DEFAULT_CHAT_MODEL        = "gemini-2.5-flash" }
if (-not $env:DEFAULT_EMBEDDING_MODEL  -or [string]::IsNullOrWhiteSpace($env:DEFAULT_EMBEDDING_MODEL))   { $env:DEFAULT_EMBEDDING_MODEL   = "text-embedding-004" }
if (-not $env:DEFAULT_VISION_MODEL     -or [string]::IsNullOrWhiteSpace($env:DEFAULT_VISION_MODEL))      { $env:DEFAULT_VISION_MODEL      = "gemini-2.5-flash" }

# --- Ports ---------------------------------------------------------------
$BackendPort  = 8000
$FrontendPort = 5173

# --- Logs ---------------------------------------------------------------
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackendOutLog  = Join-Path $LogsDir "backend_$ts.out.log"
$BackendErrLog  = Join-Path $LogsDir "backend_$ts.err.log"
$FrontendOutLog = Join-Path $LogsDir "frontend_$ts.out.log"
$FrontendErrLog = Join-Path $LogsDir "frontend_$ts.err.log"

# --- Start backend (uvicorn app.main:app --port 8000) -------------------
Write-Host "Starting backend on http://localhost:$BackendPort ..."
$backend = Start-Process -FilePath "python" -ArgumentList @(
    "-m","uvicorn","app.main:app",
    "--host","0.0.0.0",
    "--port",$BackendPort
) -WorkingDirectory $BackendDir `
  -RedirectStandardOutput $BackendOutLog `
  -RedirectStandardError  $BackendErrLog `
  -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 2

# --- Start frontend (Vite) via cmd.exe to avoid shim issues -------------
Write-Host "Starting frontend (Vite) on http://localhost:$FrontendPort ..."
$nodeExists = [bool](Get-Command "node" -ErrorAction SilentlyContinue)
$npmExists  = [bool](Get-Command "npm"  -ErrorAction SilentlyContinue)
if (-not $nodeExists -or -not $npmExists) {
  Write-Warning "Node.js/npm not found in PATH. Install Node 20+ from https://nodejs.org/ and re-run."
} else {
  # Use cmd.exe /d /c so the npm .cmd shim is executed correctly
  $frontend = Start-Process -FilePath "cmd.exe" -ArgumentList @(
      "/d","/c","npm","--prefix",$FrontendDir,"run","dev"
    ) `
    -RedirectStandardOutput $FrontendOutLog `
    -RedirectStandardError  $FrontendErrLog `
    -PassThru -WindowStyle Minimized
}

# --- Open browser tabs ---------------------------------------------------
Start-Process "http://localhost:$BackendPort"
Start-Process "http://localhost:$FrontendPort"

# --- Info ----------------------------------------------------------------
Write-Host "`nBackend PID: $($backend.Id)"
if ($frontend) { Write-Host "Frontend PID: $($frontend.Id)" }
Write-Host "Logs:"
Write-Host "  $BackendOutLog"
Write-Host "  $BackendErrLog"
if ($frontend) {
  Write-Host "  $FrontendOutLog"
  Write-Host "  $FrontendErrLog"
}
Write-Host "`nClose this PowerShell when you're done (processes keep running in background)."
