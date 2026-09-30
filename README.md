# Safe Zone Checker

See which parts of a vertical video TikTok, Instagram Reels and YouTube Shorts cover with buttons and captions, before you post it.

**Live:** https://safezone.codefolio.dev

- Drop in a video or an image and the covered areas are shaded over it.
- The TikTok and Reels zones are measured from the real apps on a phone, not copied from ad templates.
- TikTok's Arabic layout, with the buttons on the left, is included.
- The page is in English and Arabic.
- You can download the preview, or a transparent 1080 x 1920 overlay to use in any editor.
- Nothing is uploaded. The file you pick stays in your browser.

## Why another safe zone tool

Most safe zone templates use the zones the platforms publish for ads. Those reserve room for ad buttons and long captions, so they mark far more as covered than a normal post loses: TikTok's ad zone keeps 34% of the bottom clear, while a normal post on a phone covers about 13%. This tool shows both, and defaults to the measured one.

## Run it locally

There is no build step and there are no dependencies.

```
npm start        # serves the folder at http://127.0.0.1:8765
npm test         # checks the zone data (Node 20 or newer)
```

Any static file server works in place of `npm start`. Opening `index.html` straight from disk does not, because the scripts are ES modules.

## How it is organised

| File | What it holds |
|---|---|
| `index.html` | The page markup |
| `src/styles.css` | All styling; colours are variables at the top |
| `src/zones.js` | The zone data with its sources, and the geometry helpers |
| `src/i18n.js` | Every string, in English and Arabic |
| `src/app.js` | Drawing, file loading and the controls |
| `test/zones.test.mjs` | Checks that every zone is valid and the mirrored layout is right |

## Where the zones come from

Zones are stored as fractions of a 9:16 frame in `src/zones.js`.

### Normal posts, measured on a phone (30 September 2026)

Measured from screenshots of real posts on an iPhone with a 1284 x 2778 screen. Each screenshot was matched against the original video frame to find the scale and position of the video on screen, and every interface element was then read as a fraction of the video.

| Platform | How the video sits on screen | What is covered |
|---|---|---|
| TikTok | Fitted to the screen width | Top 6%, bottom 13%, 3% each side, and a button column 11% wide on the right from 46% down |
| Instagram Reels | Fills the screen height, so about 5% of each side is cropped | Top 10%, bottom 11%, 5% each side, and a button column 10% wide on the right from 66% down |
| YouTube Shorts | Not measured yet | Falls back to the ad zone, and the page says so |

Limits: one phone, a post opened from the profile, and a two-line caption. Other phones, the For You feed and longer captions can shift the numbers slightly. TikTok's Arabic layout is the same measurement mirrored and has not been measured separately.

### Ads, as published by each platform

| Platform | Zone | Source |
|---|---|---|
| TikTok | 720 x 1280 base: 80 px each side, 160 px top, 440 px bottom, and a button column 120 px wide and 720 px tall from the bottom. The Arabic file mirrors the column | "In-Feed" safe zone files on [TikTok Ads Manager help](https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads) |
| Instagram Reels | 14% top, 35% bottom, 6% each side | [Meta Ads Guide](https://www.facebook.com/business/ads-guide/update/video/instagram-reels) |
| YouTube Shorts | 1080 x 1920 template: safe area from x 48 to 888 and y 289 to 1247 | [Google Ads Help](https://support.google.com/google-ads/answer/13547298) |

## Contributing a measurement

Measurements from more phones, from YouTube Shorts and from TikTok in Arabic are welcome.

1. Post or open a video you have the original file of, ideally one with clear shapes and flat colours.
2. Take a screenshot in the app with the buttons and caption visible.
3. Open an issue with the screenshot, the original frame and the phone model. Remove anything private from the screenshot first.

To change a zone yourself, edit `src/zones.js`, update the comment above the zone with the date and device, and run `npm test`.

## Licence

MIT. See `LICENSE`. The platform icons are from [Simple Icons](https://simpleicons.org) (CC0). This project is not affiliated with TikTok, Instagram or YouTube.

Made by [Abdelhak Ahzab](https://codefolio.dev).
