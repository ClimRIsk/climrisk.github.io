# ClimRisk Intelligence — one-time local engine setup for Windows (PowerShell 5.1+).
# Creates %USERPROFILE%\.climrisk\engine-venv and installs the ClimRisk engine into it.
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File setup-local-engine.ps1 [path\to\climate_risk_engine]
# NOTE: written to mirror setup-local-engine.sh; not yet tested on a clean Windows machine.
param([string]$EngineDir = "")
$ErrorActionPreference = "Stop"
function Say($m) { Write-Host ""; Write-Host ">> $m" -ForegroundColor Cyan }
function Die($m) { Write-Host ""; Write-Host "FAILED: $m" -ForegroundColor Red; exit 1 }

$HomeDir = Join-Path $env:USERPROFILE ".climrisk"
$Venv = Join-Path $HomeDir "engine-venv"
$Src = Join-Path $HomeDir "engine-src"
if (-not $EngineDir) { $EngineDir = Join-Path $env:USERPROFILE "Documents\Claude\Projects\climrisk-engine-space\climate_risk_engine" }
if (-not (Test-Path (Join-Path $EngineDir "pyproject.toml"))) { Die "Engine not found at $EngineDir. Pass the path to the climate_risk_engine folder as the first argument." }

function Find-Python {
    $cands = @(@("py", "-3.12"), @("py", "-3.11"), @("py", "-3.10"), @("py", "-3"), @("python3"), @("python"))
    foreach ($c in $cands) {
        try {
            $exe = $c[0]; $rest = @(); if ($c.Length -gt 1) { $rest = $c[1..($c.Length - 1)] }
            $out = & $exe @rest -c "import sys; print(int(sys.version_info >= (3,10)))" 2>$null
            if ($LASTEXITCODE -eq 0 -and $out -eq "1") { return ,@($exe) + $rest }
        } catch { }
    }
    return $null
}

$py = Find-Python
if (-not $py) {
    Say "Python 3.10 or newer was not found. Trying to install it with winget"
    try { winget install --id Python.Python.3.12 -e --silent --accept-package-agreements --accept-source-agreements } catch { }
    $py = Find-Python
    if (-not $py) { Die "Python 3.10+ is required. Install it from https://www.python.org/downloads/ (tick 'Add python.exe to PATH'), then run this again." }
}
$pyExe = $py[0]; $pyArgs = @(); if ($py.Length -gt 1) { $pyArgs = $py[1..($py.Length - 1)] }
Say "Using $(& $pyExe @pyArgs --version)"

New-Item -ItemType Directory -Force -Path (Join-Path $HomeDir "cache"), (Join-Path $HomeDir "logs") | Out-Null
$VenvPy = Join-Path $Venv "Scripts\python.exe"
if (-not (Test-Path $VenvPy)) { Say "Creating Python environment at $Venv"; & $pyExe @pyArgs -m venv $Venv; if ($LASTEXITCODE -ne 0) { Die "could not create the Python environment" } }

# Install from a user-writable copy (Program Files is read-only for pip).
Say "Copying the engine to $Src"
New-Item -ItemType Directory -Force -Path $Src | Out-Null
robocopy $EngineDir $Src /MIR /XD __pycache__ .git tests .cache build /XF *.pyc /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Die "could not copy the engine (robocopy code $LASTEXITCODE)" }

Say "Installing the ClimRisk engine (first run downloads a few hundred MB of scientific libraries)"
& $VenvPy -m pip install --upgrade pip wheel
& $VenvPy -m pip install "${Src}[api]"
if ($LASTEXITCODE -ne 0) { Die "pip could not install the engine; see the messages above" }

Say "Checking the engine starts"
& $VenvPy -c "import importlib; [importlib.import_module(m) for m in ('cri.api.main','cri.licence')]; print('engine OK')"
if ($LASTEXITCODE -ne 0) { Die "the engine installed but does not start" }

$EnvFile = Join-Path $HomeDir "engine.env"
if (-not (Test-Path $EnvFile)) { "# ClimRisk local engine settings. Optional: GROQ_API_KEY=" | Set-Content -Path $EnvFile -Encoding ASCII }
Say "Done. Open ClimRisk Intelligence (or choose Retry); the engine now runs locally."
Write-Host "  Engine copy : $Src"
Write-Host "  Logs        : $(Join-Path $HomeDir 'logs\engine.log')"
