# ClimRisk Intelligence — install the fine-tuned local AI model on Windows (PowerShell 5.1+).
# Installs Ollama if missing, gets the ClimRisk model file (GGUF, ~2 GB), checks its SHA-256 against the manifest shipped with the app,
# imports it into Ollama as "climrisk-llm-v6" and tells the engine to use it. Everything runs on this computer afterwards (no cloud, no API key).
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File setup-local-llm.ps1 [-File C:\path\climrisk-llm-v6-q4km.gguf] [-Url https://...] [-Token xxx]
#   -File  : use a model file you were given (USB / shared folder)   -Url/-Token : download it (private link; token is sent as a Bearer header)
# NOTE: written to mirror setup-local-llm.sh; not yet tested on a clean Windows machine.
param([string]$File = "", [string]$Url = "", [string]$Token = "")
$ErrorActionPreference = "Stop"
function Say($m) { Write-Host ""; Write-Host ">> $m" -ForegroundColor Cyan }
function Die($m) { Write-Host ""; Write-Host "FAILED: $m" -ForegroundColor Red; exit 1 }

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$ModelDir = Join-Path $Here "model"; if (-not (Test-Path $ModelDir)) { $ModelDir = Join-Path $Here "..\model" }
$ManifestPath = Join-Path $ModelDir "model_manifest.json"; $TailPath = Join-Path $ModelDir "climrisk-llm.Modelfile.tail"; $SrcPath = Join-Path $ModelDir "model-source.json"
if (-not (Test-Path $ManifestPath) -or -not (Test-Path $TailPath)) { Die "The model manifest is missing from this install ($ModelDir). Reinstall ClimRisk Intelligence." }
$Manifest = (Get-Content $ManifestPath -Raw | ConvertFrom-Json); if ($Manifest -is [array]) { $Manifest = $Manifest | Where-Object { $_.model -eq "climrisk-llm-v6" } | Select-Object -First 1 }
$Name = "climrisk-llm-v6"; $Home2 = Join-Path $env:USERPROFILE ".climrisk"; $Dl = Join-Path $Home2 "model"
New-Item -ItemType Directory -Force -Path $Dl | Out-Null

# 1. Ollama
$ollama = (Get-Command ollama -ErrorAction SilentlyContinue)
if (-not $ollama) {
    $cand = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
    if (Test-Path $cand) { $env:Path += ";" + (Split-Path $cand) } else {
        Say "Installing Ollama (the local model runner)"
        $ok = $false; try { winget install --id Ollama.Ollama -e --silent --accept-package-agreements --accept-source-agreements; $ok = ($LASTEXITCODE -eq 0) } catch { }
        if (-not $ok) { $inst = Join-Path $env:TEMP "OllamaSetup.exe"; curl.exe -L --fail -o $inst "https://ollama.com/download/OllamaSetup.exe"; if ($LASTEXITCODE -ne 0) { Die "could not download Ollama. Install it from https://ollama.com/download and run this again." }; Start-Process $inst -ArgumentList "/VERYSILENT" -Wait }
        if (Test-Path $cand) { $env:Path += ";" + (Split-Path $cand) }
    }
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { Die "Ollama is installed but not on PATH yet. Close this window, open a new one and run this again." }
}
$up = $false; try { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3 | Out-Null; $up = $true } catch { }
if (-not $up) { Say "Starting the Ollama service"; Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden; Start-Sleep 5 }

# 2. Already installed?
$have = (& ollama list) -match "^$Name"
if ($have) { Say "$Name is already installed" } else {
    # 3. Get the file
    if (-not $File) {
        if (-not $Url -and $env:CLIMRISK_MODEL_URL) { $Url = $env:CLIMRISK_MODEL_URL }
        if (-not $Token -and $env:CLIMRISK_MODEL_TOKEN) { $Token = $env:CLIMRISK_MODEL_TOKEN }
        if (-not $Url -and (Test-Path $SrcPath)) { $Url = (Get-Content $SrcPath -Raw | ConvertFrom-Json).url }
        if (-not $Url) { Die "No model source. Re-run with -File <path to $($Manifest.file)> or -Url <download link> (you were sent one with your trial licence)." }
        $File = Join-Path $Dl $Manifest.file
        Say "Downloading the ClimRisk model ($([math]::Round($Manifest.bytes/1GB,1)) GB, one time; resumes if interrupted)"
        $args2 = @("-L", "--fail", "-C", "-", "-o", $File); if ($Token) { $args2 += @("-H", "Authorization: Bearer $Token") }; $args2 += $Url
        & curl.exe @args2; if ($LASTEXITCODE -ne 0) { Die "download failed (curl code $LASTEXITCODE). Run this again to resume." }
    }
    if (-not (Test-Path $File)) { Die "model file not found: $File" }
    # 4. Verify
    Say "Checking the file is exactly the model that was tested (SHA-256)"
    $h = (Get-FileHash $File -Algorithm SHA256).Hash.ToLower()
    if ($h -ne $Manifest.sha256.ToLower()) { Die "checksum mismatch (got $h). The file is damaged or not the ClimRisk model; it was NOT imported." }
    # 5. Import
    Say "Importing into Ollama as $Name"
    $mf = Join-Path $Dl "Modelfile"; $gg = (Resolve-Path $File).Path
    (@("FROM $gg") + (Get-Content $TailPath) + @("PARAMETER temperature 0.2")) | Set-Content -Path $mf -Encoding ASCII
    & ollama create $Name -f $mf; if ($LASTEXITCODE -ne 0) { Die "ollama could not import the model" }
    if ($File.StartsWith($Dl)) { Remove-Item $File -Force }   # the model now lives inside Ollama; free the 2 GB copy
}
# 6. Tell the engine to use it
Set-Content -Path (Join-Path $Home2 "active_model") -Value $Name -Encoding ASCII -NoNewline
Set-Content -Path (Join-Path $Home2 "active_reasoning_model") -Value $Name -Encoding ASCII -NoNewline
Say "Smoke test"
$r = & ollama run $Name "In one sentence: what is a covenant breach?" 2>&1 | Select-Object -First 3; $r | ForEach-Object { Write-Host "  $_" }
Say "Done. Reopen ClimRisk Intelligence: the AI now runs on this computer. CPU-only machines answer slowly (tens of seconds); the engine falls back to its rule-based answer if a reply is too slow."
