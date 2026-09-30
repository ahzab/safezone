# Safe Zone Checker

A one-page tool: drop in a video or image and see which parts TikTok, Instagram Reels and YouTube Shorts cover. English and Arabic, including TikTok's right-to-left layout. Everything runs in the browser; no file is uploaded.

Run it locally: `python3 -m http.server 8765` in this folder, then open http://127.0.0.1:8765/.

## Where the zones come from (read 2026-09-30)

| Platform | Zone | Source |
|---|---|---|
| TikTok | 720 x 1280 base: 80 px each side, 160 px top, 440 px bottom, and an action column 120 px wide and 720 px tall from the bottom edge. The Arabic file mirrors the column to the left. Measured from the transparent area of the two files | "In-Feed Standard LTR" and "In-Feed Arabic Version RTL" downloads on https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads |
| Instagram Reels | 14% top, 35% bottom, 6% each side | https://www.facebook.com/business/ads-guide/update/video/instagram-reels |
| YouTube Shorts | 1080 x 1920 template: safe area x 48 to 888, y 289 to 1247. Measured from the white area of the vertical template | https://support.google.com/google-ads/answer/13547298 |

These are the zones each platform publishes for ads ("Ad" mode). No platform publishes one for ordinary posts, and on a real phone the ad zones did not match what the app covers (Abdel, 2026-09-30).

## Normal-post zones, measured on a phone (2026-09-30)

Measured from two screenshots of Abdel's own posts on an iPhone with a 1284 x 2778 screen, by matching the screenshot against the original video frame (coloured tiles give the scale and offset), then reading each interface element's position as a fraction of the video.

| Platform | How the video sits | Covered |
|---|---|---|
| TikTok | fitted to the screen width (scale 1.189), top at 141 px | search bar to 5% from the top; name and caption from 88.5%; button column right of 88% from 47.7% down. In the tool: top 6%, bottom 13%, column 11% wide from 46% |
| Instagram Reels | fills the screen height (scale 1.30), so about 4.4% of each side is cropped | back and camera buttons to 9%; name and caption from 90%; button column between 86% and 93% across from 67% down. In the tool: top 10%, bottom 11%, 5% each side, column 10% wide from 66% |
| YouTube Shorts | not measured | falls back to the ad zone, and the page says so |

Both were the owner's view of his own post opened from the profile, with a two-line caption. The For You feed, other phones and TikTok's Arabic layout (shown as the same measurement mirrored) are not measured. Re-read the three sources when a platform changes its layout, and update `ZONES` in `index.html` and the date in the page's note.
