import fs from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { TextLayer } from './khmer-justify.js';

const text = await fs.readFile("assets/news.txt", 'utf8');
const $title = text.slice(0, text.indexOf("\n")).trim();
const $body = text.slice(text.indexOf("\n")).trim();

GlobalFonts.loadFontsFromDir("./fonts");

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {*} fill 
 * @returns 
 */
function render(canvas, fill = false, debug = false) {
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';

  if (fill) {
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.textBaseline = 'top';
  const padding = 144;

  const title = new TextLayer($title, {
    x: padding,
    y: padding,
    debug,
    width: canvas.width - padding * 2,
    font: "600 72pt Koh Santepheap, serif",
    fillStyle: "#15496c",
    textAlign: "left",
    lineHeight: 1.15,
  }).layout(ctx)

  if (fill) {
    title.fill()
  }

  if (fill) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(title.left, title.bottom + padding / 2, canvas.width - padding * 2, 8)
  }

  const body = new TextLayer($body, {
    x: padding,
    y: title.bottom + padding,
    width: canvas.width - padding * 2,
    font: "56pt Koh Santepheap, serif",
    fillStyle: "#333",
    textAlign: "justify",
    lineHeight: 1.35,
    debug,
  }).layout(ctx);

  if (fill) {
    body.fill()
  }

  if (fill) {
    ctx.strokeStyle = 'rgba(0,0,0,.1)';
    ctx.lineWidth = 10;
    let m = 64;
    ctx.strokeRect(m, m, canvas.width - m * 2, canvas.height - m * 2);
  }

  return body.bottom + padding;
}

await fs.mkdir("outputs", { recursive: true });

let canvas = createCanvas(2480, 3508);
let h = render(canvas);
h = Math.round(h)

canvas = createCanvas(2480, h);
render(canvas, true, true);
await fs.writeFile("outputs/image-news-debug.png", canvas.toBuffer("image/png"));

canvas = createCanvas(2480, h);
render(canvas, true);
await fs.writeFile("outputs/image-news.png", canvas.toBuffer("image/png"));
