// Safe Zone Checker: draws the chosen platform's covered areas over a video or image.
// Everything runs in the browser. The file the user picks is never uploaded.

import { ZONES, isMeasured, resolveZone, safePolygon, coveredEdges } from './zones.js';
import { STRINGS } from './i18n.js';

const WIDTH = 1080;
const HEIGHT = 1920;
const COVERED_RGB = '255,61,127';
const OUTLINE = '#FFD60A';
const EMPTY_SCREEN = '#2A1F5C';
const EXPORT_ALPHA = 0.55;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $('#c');
const ctx = canvas.getContext('2d');

const state = {
  platform: 'tiktok',
  mode: 'app', // 'app' = normal post, 'ads' = published ad zone
  dir: 'ltr', // TikTok's app layout: 'rtl' puts the buttons on the left
  alpha: EXPORT_ALPHA,
  lang: 'en',
  media: null, // the <img> or <video> being previewed
  video: null, // the same element when it is a video
  objectUrl: null,
};

// ---------- drawing ----------

function tracePolygon(g, points) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x * WIDTH, y * HEIGHT) : g.moveTo(x * WIDTH, y * HEIGHT)));
  g.closePath();
}

/** Shade everything outside the safe area and outline the safe area. */
function drawOverlay(g, alpha) {
  const zone = resolveZone(state.platform, state.mode);
  const dir = ZONES[state.platform].mirrors ? state.dir : 'ltr';
  const points = safePolygon(zone, dir);

  g.save();
  tracePolygon(g, points);
  g.rect(0, 0, WIDTH, HEIGHT);
  g.fillStyle = `rgba(${COVERED_RGB},${alpha})`;
  g.fill('evenodd');

  tracePolygon(g, points);
  g.setLineDash([22, 14]);
  g.lineWidth = 6;
  g.strokeStyle = OUTLINE;
  g.stroke();
  g.restore();
}

/** Draw the media scaled to cover the frame, the way the apps fill the screen. */
function drawMedia() {
  ctx.fillStyle = EMPTY_SCREEN;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const media = state.media;
  if (!media) return;
  const w = media.videoWidth || media.naturalWidth;
  const h = media.videoHeight || media.naturalHeight;
  if (!w || !h) return;
  const scale = Math.max(WIDTH / w, HEIGHT / h);
  ctx.drawImage(media, (WIDTH - w * scale) / 2, (HEIGHT - h * scale) / 2, w * scale, h * scale);
}

function render() {
  drawMedia();
  drawOverlay(ctx, state.alpha);
}

function tick() {
  const video = state.video;
  if (video && !video.paused) {
    render();
    $('#seek').value = Math.round((video.currentTime / (video.duration || 1)) * 1000);
  }
  requestAnimationFrame(tick);
}

// ---------- loading a file ----------

function loadFile(file) {
  if (!file) return;
  if (state.video) state.video.pause();
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(file);
  state.video = null;

  if (file.type.startsWith('video')) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.addEventListener('loadeddata', () => {
      state.media = video;
      state.video = video;
      video.play();
      showMedia(true);
    });
    video.addEventListener('seeked', render);
    video.src = state.objectUrl;
  } else if (file.type.startsWith('image')) {
    const image = new Image();
    image.addEventListener('load', () => {
      state.media = image;
      showMedia(false);
    });
    image.src = state.objectUrl;
  }
}

function showMedia(isVideo) {
  $('#drop').hidden = true;
  $('#vid').hidden = !isVideo;
  $('#dlShot').disabled = false;
  updateText();
  render();
}

function downloadPng(source, name) {
  const link = document.createElement('a');
  link.download = name;
  link.href = source.toDataURL('image/png');
  link.click();
}

// ---------- text ----------

const percent = (fraction) => `${Math.round(fraction * 1000) / 10}%`;

function chipList(t) {
  const zone = resolveZone(state.platform, state.mode);
  const edges = coveredEdges(zone);
  const chips = [`<b>${percent(edges.top)}</b> ${t.cTop}`, `<b>${percent(edges.bottom)}</b> ${t.cBottom}`];
  if (Math.abs(edges.left - edges.right) < 0.005) {
    chips.push(`<b>${percent(edges.left)}</b> ${t.cSide}`);
  } else {
    chips.push(`<b>${percent(edges.left)}</b> ${t.cLeft}`, `<b>${percent(edges.right)}</b> ${t.cRight}`);
  }
  if (zone.cut) {
    const onLeft = ZONES[state.platform].mirrors && state.dir === 'rtl';
    chips.push(`<b>${onLeft ? t.cColL : t.cColR}</b>`);
  }
  return chips.map((chip) => `<span class="chip">${chip}</span>`).join('');
}

function updateText() {
  const t = STRINGS[state.lang];
  const measured = state.mode === 'app' && isMeasured(state.platform);

  document.documentElement.lang = state.lang;
  document.documentElement.dir = t.dir;
  document.title = t.docTitle;
  $$('[data-t]').forEach((el) => {
    el.textContent = t[el.dataset.t];
  });
  $('#lang').textContent = t.other;
  $('#play').textContent = state.video && state.video.paused ? t.play : t.pause;
  $('#badge').textContent = measured ? t.badgeReal : t.badgeAd;
  $('#chips').innerHTML = chipList(t);

  const note = $('#specNote');
  note.textContent = measured ? t.nApp : state.mode === 'app' ? t.nNone : t.nAds;
  if (!measured) {
    const link = document.createElement('a');
    link.href = ZONES[state.platform].source;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = t.source;
    note.append(' ', link);
  }
}

function setPressed(selector, key, value) {
  $$(selector).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset[key] === value)));
}

// ---------- events ----------

function bindChoice(selector, key, apply) {
  $$(selector).forEach((button) => {
    button.addEventListener('click', () => {
      apply(button.dataset[key]);
      setPressed(selector, key, button.dataset[key]);
      updateText();
      render();
    });
  });
}

bindChoice('[data-p]', 'p', (value) => {
  state.platform = value;
  $('#dirs').hidden = !ZONES[value].mirrors;
});
bindChoice('[data-m]', 'm', (value) => {
  state.mode = value;
});
bindChoice('[data-d]', 'd', (value) => {
  state.dir = value;
});

$('#pick').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', (event) => loadFile(event.target.files[0]));

const stage = $('#stage');
['dragenter', 'dragover'].forEach((name) =>
  stage.addEventListener(name, (event) => {
    event.preventDefault();
    stage.classList.add('over');
  }),
);
['dragleave', 'drop'].forEach((name) =>
  stage.addEventListener(name, (event) => {
    event.preventDefault();
    stage.classList.remove('over');
  }),
);
stage.addEventListener('drop', (event) => loadFile(event.dataTransfer.files[0]));

$('#alpha').addEventListener('input', (event) => {
  state.alpha = event.target.value / 100;
  render();
});

$('#play').addEventListener('click', () => {
  const video = state.video;
  if (!video) return;
  if (video.paused) video.play();
  else video.pause();
  updateText();
});

$('#seek').addEventListener('input', (event) => {
  const video = state.video;
  if (!video) return;
  video.pause();
  video.currentTime = (event.target.value / 1000) * (video.duration || 0);
  updateText();
});

$('#dlShot').addEventListener('click', () => downloadPng(canvas, `safe-zone-${state.platform}.png`));

$('#dlOverlay').addEventListener('click', () => {
  const overlay = document.createElement('canvas');
  overlay.width = WIDTH;
  overlay.height = HEIGHT;
  drawOverlay(overlay.getContext('2d'), EXPORT_ALPHA);
  const kind = state.mode === 'app' && isMeasured(state.platform) ? 'post' : 'ad';
  const side = ZONES[state.platform].mirrors ? `-${state.dir}` : '';
  downloadPng(overlay, `overlay-${state.platform}-${kind}${side}.png`);
});

$('#lang').addEventListener('click', () => {
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  // An Arabic speaker most likely runs TikTok in Arabic, so start them on that layout.
  if (state.lang === 'ar' && state.dir === 'ltr') {
    state.dir = 'rtl';
    setPressed('[data-d]', 'd', 'rtl');
  }
  updateText();
  render();
});

updateText();
render();
tick();
