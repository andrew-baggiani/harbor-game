# Harbor & Co. Monday v2 voice fetch (take A of each line).
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2.ps1
# Signed links expire 2026-11-15 19:00 UTC. After that, export from the ElevenLabs flow instead (see docs\VOICE_SCRIPT.md).
$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\voice\v2"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$raw = Join-Path $dest "_raw"
New-Item -ItemType Directory -Force -Path $raw | Out-Null
$files = [ordered]@{
  "brief" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/UctkIIlYIcu5IFgHbgw3/v0HTqNwuc7xG9R4q5bwh/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=6ABNne_y-NlQd0T9yVPyyERiSBI="
  "door" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/CbGNDt4hKe6cijzCGvKJ/oRCzeD6TUF4SpqPlzy6L/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=3QtD13r6wHFGdWDx6v2vF5kH3WU="
  "reception" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/jzDn1GvW2XpzoOIDLISk/drc1cL8CWdLPSOlt0kvt/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=Kj8dXCrFXFezlMmWPXgg4tLh1RI="
  "reception-ok" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/vsPpmmFpp1ZICa8rn8qQ/Mq3KMSPrb9jJT664jtjU/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=YNS_1AfToLBmhUsGzI0MK9Pvh9s="
  "phone" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/YQmTblZqj8I9Xpq5M8fk/g9QEiG5GtEBGhdkE3JcR/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=hCrprHkZrjQyGX6s4UjgCn4QiJM="
  "maya" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/NvnUydfYbjk0Ss2U0gQt/WwJvj5cy5EpXjQ7P27pR/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=nxISpmdNw52mrCPehkHZOWv85bk="
  "mail" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/gnSXTgJQxQkZRi8MoMlb/iWQH9GfQvER0EdCITzmH/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=oJ_ZmqNXMWG6L8aOhXMMfzGQMPg="
  "usb" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/Ca1vWEsOiNKLz8hZ26h7/ZWGhP6OEVw95gbsYO5Os/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=iBDxUM-so-XXn5n_8-zo9n_BaEA="
  "door-hold" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/rFCASXe3MRpn9OGqHBPl/7ebRlEKp51PUgEQJhfHW/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=J7bjcaMVzKLSOU56Lm-dgoUTRPo="
  "debrief-door-hold" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/dkiP3qcxrrQPBaPTOorp/o8h7Gq0jxSq80kwklImQ/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=rlhEz7eP5ZmEvIaGlXVRPUEhE30="
  "door-shut" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/wzeCyPza76vTqhVbmSyF/FLs7X7gt7KMvuU66ztPl/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=J4jIrtxv5FXSOPFVn2xzwFzwWjU="
  "debrief-door-shut" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/AU2HtSOISCEdc8JrNS8H/pQJn6IKwf5anCfEtQKjn/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=PZjMN4Utq0mmRH53TFyWIEbqpe0="
  "mail-codes" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/RVqGMN9h9IreZFnw4r0R/7epBcJy77tRTDFVU0K1w/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=kr3rhG1PfF8usvAa1sG2Q0FrnDM="
  "debrief-mail-codes" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/UwuZYaQTwZwrmbnjgd3x/udj9Jxa4nuNAEGwsTOiz/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=APVCSPDUWk90N3DEJmObuTmlafc="
  "mail-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/D5DyPooAusgu4RH387b0/FGpdNodp4IR8T6UykuOc/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=N5Q7mXSaAfrfj_MAXhw8up0YFxk="
  "debrief-mail-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/OMVyI6S4w5omu12dv8dn/RI7xrEtno2EWtaGulKOF/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=eMCyFISS3bqeTSdWA8fgbiGMj0Y="
  "mail-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/M1Vhdbd78He7vEyq9jvd/DDh0MPtiq7Ttj0MOBayA/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=RbK1Yg80XPB190KLv-Pn06DVbh0="
  "debrief-mail-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/GmDkqeV377BDf2BgRAe6/8mgUPoUHBg3To9LbJMCl/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=TiRdLPkab2mapi9mBTHHURt5Y5g="
  "phone-code" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/aUmUkUm8UGeJktPYMKOj/lvEc42EaL63ktv27jyxu/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=KpcKJHnOrZVhFEBlugLpC46szBk="
  "debrief-phone-code" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/4dcWEYB8ZqbJmGfRjiMp/rexGQuqLNxGa9ByeU8Rw/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=SoCFKbOcx1KfgXXO6RmQNbZgYrU="
  "phone-hangup" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/uwDspLKmPX0W4cD5sD10/N5cQ3KyzbM9RvRs2LD2l/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=zBTeU43iBqQ7fqLWwkCBwQdbydk="
  "debrief-phone-hangup" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/mMBLgpU8aHLc5GHjzetu/8KpsEHUWq6Sfc8Fxx0RM/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=jhjNMvchoxl7Pkhfr-CZ4rZEeXk="
  "usb-plug" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/wyI0KgySGLZzHo30rGvD/L8Vj6cu2RTeue1ZIxQov/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=oiPBboPYsHkHXYBZnBfH3och0SQ="
  "debrief-usb-plug" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/eACiYwDi70yiKsDpfItj/KT4S9bSokaEeG1f13Gmm/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=bc4vbQF2boRf4ly4kBFGsXP5oDE="
  "usb-it" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/8eLyOEgNZqj4GBRxKTbX/xal6R3u9VrG3GxecBnHv/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=2VTGMJ64KimS6YiBzqsGyIe0xhk="
  "debrief-usb-it" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/tU1pSg4edypI07Z4278t/U1l6zCRvNbIOTOomOeaD/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=nAPSRMD3sWNltJ7Q-HtuE1SAB9I="
  "usb-leave" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/UfQI8wkgxq5BHoOgsuOd/bKj2U5qtiHF7xCAKforR/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=NAbl2xqRLwv_Muba82LjlW_uMRc="
  "debrief-usb-leave" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/eXqMJg62E3Rj9W0pJrL8/lLkbcjEvHTBoyJpW4IwG/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=XWYOAPcXJ7EH6rvjkSRcuhvYVOc="
  "wire-send" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/FE1QwmFyVaAXxEzCXqWx/t4DNy6s6V6OKmWXWOfl8/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=VmCXETwVL45KokHhN0rR0QZOzQI="
  "debrief-wire-send" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/D7WRhzuIQb7jaQzV9I8s/bAODFRzmaQMXvD79zFG7/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=6jS0p34QaFRQIleO--6yv5R_LIs="
  "wire-call" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/pAGayHbKbdvgJN1Ncsgw/bhfdHV42Wuq4fMJ4EqPw/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=zrtdN_MW6SDuweqLmfe1BAIZhF8="
  "debrief-wire-call" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/ERzOJwwtEE8ysus5Sheq/qwpeyIHBQiYO3qFN4Sqf/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=2DOW8tUhVYporb5cSVZ-vVq1fYI="
  "wire-refuse" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/4KsbBsgLEisI23OTeJBt/LCJS5egCdMQBD7kEv3RY/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=f-B0EDFy8bZ6vYaCkOKaIbjXsww="
  "debrief-wire-refuse" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/IHQtCd29tskh2ehFz4Yr/06ctGGg21gXNRpNmrdOE/content.mp3?Expires=1794769200&KeyName=assets-cdn-key-1&Signature=mEQg69h9bvhUMClB9rWRhuyjdL8="
}
foreach ($k in $files.Keys) {
  $out = Join-Path $raw "$k.mp3"
  Write-Host "Fetching $k"
  Invoke-WebRequest -Uri $files[$k] -OutFile $out -UseBasicParsing
}
$ff = Get-Command ffmpeg -ErrorAction SilentlyContinue
foreach ($k in $files.Keys) {
  $in = Join-Path $raw "$k.mp3"; $out = Join-Path $dest "$k.mp3"
  if ($ff) {
    # trim leading/trailing silence, loudness-normalize to -16 LUFS, mono 44.1 kHz 128 kbps
    & ffmpeg -y -loglevel error -i $in -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=11" -ac 1 -ar 44100 -b:a 128k $out
  } else { Copy-Item $in $out -Force }
  $d = "?"
  if (Get-Command ffprobe -ErrorAction SilentlyContinue) { $d = (& ffprobe -v error -show_entries format=duration -of csv=p=0 $out) }
  Write-Host ("{0,-22} {1}s" -f $k, $d)
}
if (-not $ff) { Write-Warning "ffmpeg not found: files copied as-is (not trimmed or normalized). Install ffmpeg and re-run to process." }
Remove-Item -Recurse -Force $raw
Write-Host "Done: $dest"
