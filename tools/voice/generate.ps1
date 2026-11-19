# Dry Run Cyber: record every voice line in docs\voice-all.json with ElevenLabs, straight into public\voice\v2.
# Lines that already have a file are skipped, so it is safe to run again after adding lines.
#
# Run from the repo root (PowerShell):
#   powershell -ExecutionPolicy Bypass -File tools\voice\generate.ps1
#
# It asks for your ElevenLabs API key (Profile > API keys on elevenlabs.io). The key is used for this run only
# and is not saved anywhere. About 10,000 characters for the full sheet.
param(
  [string]$Model = "eleven_v3",
  [string]$Only = ""   # e.g. -Only play   or   -Only ai   to record one group
)
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "..\.."
$sheet = Get-Content (Join-Path $root "docs\voice-all.json") -Raw | ConvertFrom-Json
$dest = Join-Path $root "public\voice\v2"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$key = $env:ELEVENLABS_API_KEY
if (-not $key) {
  $secure = Read-Host "ElevenLabs API key" -AsSecureString
  $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

$done = 0; $skipped = 0; $failed = @()
foreach ($line in $sheet) {
  if ($Only -and $line.shift -ne $Only) { continue }
  $out = Join-Path $dest "$($line.id).mp3"
  if (Test-Path $out) { $skipped++; continue }
  $body = @{ text = $line.text; model_id = $Model } | ConvertTo-Json -Compress
  $url = "https://api.elevenlabs.io/v1/text-to-speech/$($line.voice_id)?output_format=mp3_44100_128"
  try {
    Invoke-WebRequest -Uri $url -Method Post -Headers @{ "xi-api-key" = $key; "Accept" = "audio/mpeg" } `
      -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body)) -OutFile $out -UseBasicParsing
    $done++
    Write-Host ("[{0}] {1}  ({2})" -f $done, $line.id, $line.voice)
  } catch {
    if (Test-Path $out) { Remove-Item $out }
    $failed += $line.id
    Write-Warning "$($line.id): $($_.Exception.Message)"
  }
}
Write-Host ""
Write-Host "Recorded $done, already had $skipped, failed $($failed.Count)."
if ($failed.Count) { Write-Host "Failed: $($failed -join ', ')"; Write-Host "Run the script again to retry just those." }
Write-Host "Then commit public\voice\v2 in GitHub Desktop and push."
