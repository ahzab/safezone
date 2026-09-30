// Safe zones as fractions of a 9:16 frame (0 is the left or top edge, 1 the right or bottom).
//
// Each platform has up to two zones:
//   app: what a normal post looks like in the real app, measured from a phone screenshot
//   ads: the zone the platform publishes for ads, which is wider
//
// A zone is a rectangle (x0, x1, y0, y1). `cut` removes the button column from it: a strip
// `w` wide on the right edge (the left edge in a right-to-left layout), from `y` down to y1.
//
// To add or correct a measurement, see "Contributing a measurement" in the README.

export const ZONES = {
  tiktok: {
    // Measured 2026-09-30 on an iPhone with a 1284 x 2778 screen. The video is fitted to the
    // screen width. The search bar reaches 5% from the top, the name and caption start at
    // 88.5%, and the button column sits right of 88% from 47.7% down. Rounded outward.
    app: { x0: 0.03, x1: 0.97, y0: 0.06, y1: 0.87, cut: { w: 0.11, y: 0.46 } },
    // TikTok Ads Manager "In-Feed" safe zone files (720 x 1280 base): 80 px each side,
    // 160 px top, 440 px bottom, and a button column 120 px wide and 720 px tall from the
    // bottom edge. The Arabic file mirrors the column.
    ads: { x0: 80 / 720, x1: 640 / 720, y0: 160 / 1280, y1: 840 / 1280, cut: { w: 120 / 720, y: 560 / 1280 } },
    source: 'https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads',
    mirrors: true, // the app has a right-to-left layout with the buttons on the left
  },
  reels: {
    // Measured 2026-09-30 on the same iPhone. Instagram fills the screen height, so about
    // 4.4% of each side is cropped. Back and camera buttons reach 9% from the top, the name
    // and caption start at 90%, and the button column sits from 67% down.
    app: { x0: 0.05, x1: 0.95, y0: 0.10, y1: 0.89, cut: { w: 0.10, y: 0.66 } },
    // Meta Ads Guide, Instagram Reels: 14% top, 35% bottom, 6% each side.
    ads: { x0: 0.06, x1: 0.94, y0: 0.14, y1: 0.65 },
    source: 'https://www.facebook.com/business/ads-guide/update/video/instagram-reels',
    mirrors: false,
  },
  shorts: {
    // Not measured on a phone yet.
    app: null,
    // Google Ads Help, "Universal safe zones for video ads on YouTube", vertical template
    // (1080 x 1920): the safe area runs from x 48 to 888 and y 289 to 1247.
    ads: { x0: 48 / 1080, x1: 888 / 1080, y0: 289 / 1920, y1: 1247 / 1920 },
    source: 'https://support.google.com/google-ads/answer/13547298',
    mirrors: false,
  },
};

/** True when the platform has a zone measured in the real app. */
export function isMeasured(platform) {
  return Boolean(ZONES[platform].app);
}

/** The zone to draw: the measured one when asked for and available, the ad zone otherwise. */
export function resolveZone(platform, mode) {
  const p = ZONES[platform];
  return (mode === 'app' && p.app) || p.ads;
}

/**
 * The safe area as a polygon of [x, y] points in fractions, clockwise from the top left.
 * `dir` is 'rtl' to put the button column on the left.
 */
export function safePolygon(zone, dir = 'ltr') {
  const { x0, x1, y0, y1, cut } = zone;
  if (!cut) return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  if (dir === 'rtl') {
    return [[x0, y0], [x1, y0], [x1, y1], [x0 + cut.w, y1], [x0 + cut.w, cut.y], [x0, cut.y]];
  }
  return [[x0, y0], [x1, y0], [x1, cut.y], [x1 - cut.w, cut.y], [x1 - cut.w, y1], [x0, y1]];
}

/** How much of each edge is covered, as fractions. */
export function coveredEdges(zone) {
  return { top: zone.y0, bottom: 1 - zone.y1, left: zone.x0, right: 1 - zone.x1 };
}
