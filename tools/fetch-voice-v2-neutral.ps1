# Harbor & Co. Monday: 11 re-recorded lines with no company name or extension numbers in the audio.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2-neutral.ps1
# Links expire 2026-11-16 18:00 UTC (1:00 PM Eastern). Do not commit this file.
$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\voice\v2\_raw_neutral"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$base = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/"
$q = "/content.mp3?Expires=1794852000&KeyName=assets-cdn-key-1&Signature="
$files = [ordered]@{
  "brief" = "SiEqlaWs2PfADCOnXiHk/r2bvMkzArYtr1hvRKY5W|-Nce6Z3L2EHa1iH1FSqq-8qSVvI="
  "signin" = "6vmZf8MkmKYOEeqIY18i/cZLQnD8O4fSfB709Uxzm|E6cYk8gCWUdXq8TNEJRj0NbmH1A="
  "debrief-signin-yes" = "NGZhn883EdbZFG7MDgVQ/MTpLOfuKR6RPXP0glWWW|NnhU4SCZe7UJssDNm8kQZcM6tWE="
  "debrief-signin-report" = "0i2aC0ITsB8tbcueSZQG/KpRLn7vuSXKtgHxz09Xy|UvT_w0lhngvL5-yfgs18CLOUjnQ="
  "debrief-misdirect-hide" = "bGGKqI9ZRptvnQzBMQm8/zqp72yUGj23pgptNh4Hj|TCEYTRrLMT-rC2OX-0tviXgwpgw="
  "phone" = "Zr61VoUfUbHW1e8PPzpP/WbG1bL0YsXR8g0y3MBRm|sChWPED0nZ-0FKLsKbISRN5e2Zg="
  "debrief-mail-codes" = "fKeanLhR90ndcUuPT9Ug/VaUCh9IUQozQnPcPkoth|l_tIVbM1IOMw1EIPrC-QBtx0LYQ="
  "debrief-mail-report" = "nYxC1rLhYEVCKAMXaTI7/4VEESogefW8wWhbYxCMW|vgBzY85vLU1vfcOKouW3ebpN-44="
  "debrief-phone-hangup" = "1UQT62Hg6yzMbU5GcaL4/5eeUcbtQe6niuPnMt1Pi|4N8tgw1lgjFVkhseKrC6UTL69bQ="
  "debrief-usb-leave" = "EgFFHuHIac1QYQ1qvNJI/ieXxf5dGkTS4NxoDhXpy|b8oWMOo-c4ml3_n2Rp0s-7A5DfQ="
  "v2-fallout-misdirect" = "vRKj9KM1fwpTrCcm59yU/W1rpyCLAoOCB2UkHneTd|rT-Jn1BCoLY7XIEvbreVeT-Ap9U="
}
$i = 0
foreach ($name in $files.Keys) {
  $i++
  $parts = $files[$name].Split("|")
  Write-Host "[$i/$($files.Count)] $name"
  Invoke-WebRequest -Uri ($base + $parts[0] + $q + $parts[1]) -OutFile (Join-Path $dest "$name.mp3") -UseBasicParsing
}
Write-Host "Done. Tell Claude so it can trim and level them."
