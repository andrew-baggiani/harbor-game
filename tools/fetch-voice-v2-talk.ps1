# Harbor & Co. Monday v2 conversation lines (door, phone, USB, updates, wire, follow-up calls): 19 clips.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2-talk.ps1
# Links expire 2026-11-16 16:00 UTC (11:00 AM Eastern). ElevenLabs flow: "Harbor & Co. - Monday v2 conversations".
# Do not commit this file.
$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\voice\v2\_raw_talk"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$base = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/"
$q = "/content.mp3?Expires=1794844800&KeyName=assets-cdn-key-1&Signature="
$files = [ordered]@{
  "v2-door-who" = "wNeaB9NJavfsdqfGOpPF/BdzEbc8KnppC0ddxMhOX|dAoWmczZgKgnVBwPuLHnfgjHxqE="
  "v2-door-reception" = "cH9rpGCSeaXOhqbPojSE/2nvg4e0X32kwpEYpUeWz|lmuYxWzdHbgdVd3AgcTjPl3dJ-g="
  "v2-door-push" = "2NuA1XP1XGXz73ynXaZm/RJ0BXQWr5qSfnCEJytfo|dNvHrPJprW3Jfu-dUPY7Z3kPa10="
  "v2-phone-name" = "QgYbkVzl5dsy8qzHAdaY/RRObQ0zXqvhD0MVwsl0W|EqqmjJfPkSNyyjEKqTTLn2wUjxI="
  "v2-phone-ext" = "zwRFFE32vrDtdhmLAyyT/IBVjlwI93Vv9p1ZoXFeu|n4_KltiHai-n-laQE0UMXbdx760="
  "v2-phone-why" = "U64MfXWuKwbRUdwkpiC2/Lw7LPip1BwuSh6sXPhjI|xuT0FPdkeM_abZRh0gLzydoVwS4="
  "v2-phone-callback" = "akjaQuXSeUcogyUWyvM9/wYnTAc7XHikdDNG4bXav|OHzJ6pQ_wJvl0MfYcZ12QFxH1Ec="
  "v2-phone-push" = "8sFVKxo1mcDWK4Vi1lI8/6MniWVgTBAPIUC9zvRxo|Jy55cOGwQWLSvXMQrNcFuHO81FY="
  "v2-phone-idle" = "VjaHI15tQxsf97Db3nmj/nxEH1VLI69iMlo4NGzqk|nTsWh_NoEjV4quA6wwzF7g7T74A="
  "v2-phone-desk" = "9kJPQDdak6EAhWNwAXln/GqUXUJRvGexRnIVXCKuV|S0ZhQf1NVloambBlJPtHbdY9YXs="
  "v2-usb-it" = "LU0VNV4Z41uwgVTsNniA/OtJ1CAiHnwQ7LQoT60TM|Q0oWVxF-JwtqA64QE-DJSOk04yg="
  "v2-updates-it" = "swvHbWp39W27sURhyX2l/B770y6Hmgnw2RCnCSwTw|l96WXdnJGmS5hmFNeMMrDYS54m8="
  "v2-fallout-it" = "BcotZW9hpZfWvB2RK0jQ/DNufMW5lQnVfy8FvogCg|uaCQgxcudEWKK1ddgycYDDPnwz8="
  "v2-updates-restarted" = "bETemBJBcrXzTWcuAB5L/OhSK7yQb43XowyH9NJSG|wHjKoJjaXFFvqgpLTp4O7BjG2Rg="
  "v2-fallout-printer" = "vYELEGYcnTVlvmm8RoJA/CQszT3WsfO33UIvaGN8F|apNDHELKBbysoNbymXe__BmHyIo="
  "v2-wire-whyme" = "qrdrnVl5WE3dCt66uRyz/aSMCqd6ryvJeViFyT5mR|2t-BLgIm5OUm4Wqc0DBKyac2p98="
  "v2-wire-refused" = "wmk1ZL9JIGyyIGnqoIut/eqlXtcfcel2KwoxNRjsD|wEOnSzOaUzQS5COmYIMpghaNFvc="
  "v2-wire-elena" = "Lx0i1WIj3e88719xXxVR/EAAkGRQPDzE4HZRcK1eG|V0flua-xO2wilZYMV2flij7bGPI="
  "v2-fallout-misdirect" = "Uhy2chdq0AxQ45XgEZ1q/Xvw9STRpD2IHbZfEjXMz|wvF7X9dWdNhfLhDK1LTV9iDz9oY="
}
$i = 0
foreach ($name in $files.Keys) {
  $i++
  $parts = $files[$name].Split("|")
  $url = $base + $parts[0] + $q + $parts[1]
  $out = Join-Path $dest "$name.mp3"
  Write-Host "[$i/$($files.Count)] $name"
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
}
Write-Host "Done. $($files.Count) clips in public\voice\v2\_raw_talk. Tell Claude so it can trim and level them."
