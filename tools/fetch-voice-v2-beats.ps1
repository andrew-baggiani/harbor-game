# Harbor & Co. Monday v2 voice fetch for the four gap beats (06 updates, 07 sign-in, 08 misdirect, 09 clean desk): take A of each line.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\fetch-voice-v2-beats.ps1
# Signed links expire 2026-11-15 22:00 UTC (4:00 PM Central). After that, export from the ElevenLabs flow instead (see docs\MONDAY_BEATS.md).
$ErrorActionPreference = "Stop"
$dest = Join-Path $PSScriptRoot "..\public\voice\v2"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$raw = Join-Path $dest "_raw_beats"
New-Item -ItemType Directory -Force -Path $raw | Out-Null
$files = [ordered]@{
  "updates" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/RoSaZ192ek222Xr39oBF/AgfEEe0ZL0ylpKuskMGy/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=5LyvqdWwImSyuJdtM16HUO66DTA="
  "updates-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/M22bZSKHFm8LLfJUMAdk/YhqOEsYO9tx7Eru1Se2W/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=JCoa9aLW1xYW5Q6iZ5gT1u4zQ-0="
  "debrief-updates-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/fnFaW7ggYtQ5LCK7vfOV/lQ65d4yqOlKCvofeO2vQ/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=OXnkYGKhS59Mb1auH8P_xA29knE="
  "updates-restart" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/rNoYqxxx28RpR9puzNTU/i0B3AI54SWuDpbLv9KdX/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=2w5kpMRIaGAS31oTnmHDCu3ZkpQ="
  "debrief-updates-restart" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/MCTjOgvkVfuNoSmTrrro/H6c6McDmd1JyGFwRdkp0/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=at29ucUN3io2JuDexlJWP4a1Phc="
  "updates-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/gBGqdHGFNv5MCASmKWNc/iIsPUShK74hlyWxs9K0a/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=G9wBbC8hehsoCTqd0kRyXcAMzlw="
  "debrief-updates-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/MCR28BSGBKLSi7oNn7MF/eXwK01nVtIVO1uS7HMRb/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=gwwZUe0YiqR_TifZPOinHW5gWL0="
  "signin" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/mPIYZdfb2ExKXCMujsOR/p02JGtWD10GY9LjIgAuz/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=0KRrbdOXLrgjg6BJ8hMqBfiNy-8="
  "signin-yes" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/7e151efhYzKx3ddW4OFY/DX6dz2LWN9G9v1w5kCQz/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=RskbLA20SHNQewxAyQLuiI3xVWU="
  "debrief-signin-yes" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/BQlJ03g6y9AOrwPhRC5g/HfwEEVoqnDAE2N0sFnn1/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=argB8irnZTXgmqKzZCwuvjalxUA="
  "signin-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/eUjhguDgd7Z210SV5bdv/jcukvwHfZqqREQOXXDfR/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=pJ8nupflsvhituvapcuLaNBYKMw="
  "debrief-signin-ignore" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/Sbw99sOHWBqivKDS406n/CteMV0VJgtURpHf4w8nZ/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=9CxGaRw9U0WGsYyIINdl0YemhAY="
  "signin-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/pMnm7Qlh4B7WZE6u6Co8/UMywLnBEeg9ZMwP1rvDd/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=LtBIn2EtxNI3XHxfarfB6G4YR6I="
  "debrief-signin-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/X366GPXWIjfKx7wX1M1n/XyqX3OVEoqo2jYKxjnDE/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=Jk_UR3KnMudNXUm54klsQbVLUFQ="
  "misdirect" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/jlQiN4GnJZzJsHzJlA2U/SCdILGVn7fyEU8Pj0lPX/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=zmEfUFHO_ldZHbxz06Ei3fIL98E="
  "misdirect-send" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/lxGabOdxtNLL0xOQhYap/emBU7ZMRqCyzndVECHvQ/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=SVMvWnh46rUo04lhjOpdBnFOLLg="
  "misdirect-check" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/OgHnySuEXxqs1b8QeakK/HXfPLbIjxiw5Cnw9lRer/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=gcYyb_sL8s4bOlu99vg54HOuJ2I="
  "debrief-misdirect-check" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/cFPvZkManMYQKsrjFWyj/h7M7WKqH4nEdkVREi9pK/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=NX3qQVNa05BV3SeBsuVcrrk0DHg="
  "misdirect-hide" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/LFVJw4IM5T7tZ1ya6JB5/dYq8Xhdd1676AQlW28dp/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=fhQZmDGnq-UYWlk3Y9W3xa9HBwo="
  "debrief-misdirect-hide" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/yZVtq9NDko5EnYQlaeyd/aiTGHt1sYOmTVxkCkoAM/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=3bOWbqu5Y4MN3AQ_NU_cUeO1UEs="
  "misdirect-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/TzxDIfkaoWOIK6r0bIIz/3xyLsTgWKkjnaAD9Ghu2/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=zY-9arOxYQTFo2QKZLuZRkwl-3o="
  "debrief-misdirect-report" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/6zIMSWuxZdXwkj6727o3/6XcfZ7VCgaKO3Lp9nQBw/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=65S7l3u99L2KpKDNbEuxnelbLX4="
  "cleandesk" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/1NBJoUx9EKCRYcvYLB7Z/N3ZI5mdgTdn0Yg61cKTq/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=vnExQY-TIiKu0lZW9aEL3nj8EfY="
  "cleandesk-leave" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/6VOb06YHGOwolnmeqs83/J1dWYbzrwefptQfpxXja/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=eMSlzyuLNBsX9ghgvqd54WFUmxs="
  "debrief-cleandesk-leave" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/8U4MyR8gaLSbpfXGqtpA/22n9NXyo5vcLy5pMD3om/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=zj1tmggRp1PxfkttV0X6SjjUKCU="
  "cleandesk-home" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/4aWqGaP3Lm4DmYw9es6c/umU22zlwn8b8k8OiI66s/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=Qs4hNKl012pA5UKiRR6R9HDm0nU="
  "debrief-cleandesk-home" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/7c8RA7x3lvuhdl2UFZFu/CqNsNApoFUk3EOo2x7N7/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=hoU8p2S_7ue4_xaUtuWlXv-bkqk="
  "cleandesk-lock" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/ZJ3DquP3kfNlmMIumJyB/0sQGq2fJBAtMEGgaWRES/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=ItZGo9T366dWzAvDGeNz295U3O4="
  "debrief-cleandesk-lock" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/J1fMxJzFkztY3Mm8gMLn/D0hm1gj3QWHNuB9HDVkW/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=_md_vLRxr4P8LrXM86fOwFV8stA="
  "cleandesk-shred" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/kO4Y540RYFrHQWXrW5uo/8SX4fFqJH9yqtcZfykox/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=1rnb4IbgH_mlS-Z_tkkQ7EiEwio="
  "debrief-cleandesk-shred" = "https://elevenlabsusercontent.com/database/workspace/ae87da339f7f4896b17f477e8c5b259a/content_generation/63r5QXXSfYbhcjPy88rI/paKHNgJmZBTQIAVt1Bna/content.mp3?Expires=1794780000&KeyName=assets-cdn-key-1&Signature=kwGPWEl5Mgn_vwQeUq9atjo-tUU="
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
  Write-Host ("{0,-26} {1}s" -f $k, $d)
}
if (-not $ff) { Write-Warning "ffmpeg not found: files copied as-is (not trimmed or normalized). Install ffmpeg and re-run to process." }
Remove-Item -Recurse -Force $raw
Write-Host "Done: $dest ($($files.Count) files)"
