# Dry Run Cyber: record voices, music, room tone and sound effects with ElevenLabs.
#   Voices  (docs\voice-all.json) -> public\voice\v2\<id>.mp3
#   Music, room tone, effects (docs\audio-all.json) -> public\audio\<id>.mp3
# Anything that already has a file is skipped, so it is safe to run again.
#
# Run from the repo root (PowerShell):
#   powershell -ExecutionPolicy Bypass -File tools\voice\generate.ps1
# Just one group:
#   powershell -ExecutionPolicy Bypass -File tools\voice\generate.ps1 -What music     (or voices, sfx)
#
# It asks for your ElevenLabs API key unless $env:ELEVENLABS_API_KEY is set. The key needs Text to Speech,
# Sound Effects and Music access. It is used for this run only and not saved anywhere.
param(
  [ValidateSet("all", "voices", "music", "sfx")]
  [string]$What = "all",
  [string]$Model = "eleven_v3"
)
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot "..\.."

$key = $env:ELEVENLABS_API_KEY
if (-not $key) {
  $secure = Read-Host "ElevenLabs API key" -AsSecureString
  $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
$headers = @{ "xi-api-key" = $key; "Accept" = "audio/mpeg" }

$done = 0; $skipped = 0; $failed = @()
function Record([string]$url, [hashtable]$body, [string]$out, [string]$label) {
  if (Test-Path $out) { $script:skipped++; return }
  $json = $body | ConvertTo-Json -Compress
  try {
    Invoke-WebRequest -Uri $url -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" `
      -Body ([Text.Encoding]::UTF8.GetBytes($json)) -OutFile $out -UseBasicParsing -TimeoutSec 600
    $script:done++
    Write-Host ("[{0}] {1}" -f $script:done, $label)
  } catch {
    if (Test-Path $out) { Remove-Item $out }
    $script:failed += $label
    Write-Warning "${label}: $($_.Exception.Message)"
  }
}

if ($What -eq "all" -or $What -eq "voices") {
  $dest = Join-Path $root "public\voice\v2"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $sheet = Get-Content (Join-Path $root "docs\voice-all.json") -Raw | ConvertFrom-Json
  foreach ($line in $sheet) {
    Record "https://api.elevenlabs.io/v1/text-to-speech/$($line.voice_id)?output_format=mp3_44100_128" `
      @{ text = $line.text; model_id = $Model } (Join-Path $dest "$($line.id).mp3") "$($line.id)  ($($line.voice))"
  }
}

if ($What -ne "voices") {
  $dest = Join-Path $root "public\audio"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $sheet = Get-Content (Join-Path $root "docs\audio-all.json") -Raw | ConvertFrom-Json
  foreach ($a in $sheet) {
    $out = Join-Path $dest "$($a.id).mp3"
    if ($a.kind -eq "music") {
      if ($What -eq "sfx") { continue }
      Write-Host "Composing $($a.id) ($($a.seconds) s), this one takes a minute..."
      Record "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128" `
        @{ prompt = $a.prompt; music_length_ms = [int]($a.seconds * 1000); force_instrumental = $true; model_id = "music_v1" } $out "$($a.id) (music)"
    } else {
      if ($What -eq "music") { continue }
      $influence = 0.4
      if ($a.influence) { $influence = $a.influence }
      $body = @{ text = $a.prompt; duration_seconds = $a.seconds; prompt_influence = $influence; model_id = "eleven_text_to_sound_v2" }
      if ($a.kind -eq "loop") { $body.loop = $true }
      Record "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128" $body $out "$($a.id) ($($a.kind))"
    }
  }
}

Write-Host ""
Write-Host "Recorded $done, already had $skipped, failed $($failed.Count)."
if ($failed.Count) { Write-Host "Failed: $($failed -join ', ')"; Write-Host "Run the script again to retry just those." }
Write-Host "Then commit public\voice\v2 and public\audio in GitHub Desktop and push."
