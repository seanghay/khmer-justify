import fs from 'node:fs/promises';
import { createCanvas, SvgExportFlag } from '@napi-rs/canvas'
import { TextLayer } from './khmer-justify.js';
import { optimize } from 'svgo';

const TEXT_RAW = `
តាម​ការ​បូក​សរុប​ស្ថិតិ​បង្ហាញ​ថា កំពង់ចាម​ជាប់​ចំណាត់ថ្នាក់​លេខ​១ ជា ខេត្ត​ទទួល​អ្នក​ដើរ​លេង​ចូល​ឆ្នាំ​បួន​ថ្ងៃ​ច្រើន​ជាងគេ​ដោយ​ទទួលភ្ញៀវ​ជាង ៥​លាន​នាក់ ចំណែក​លេខ​២ បាន​ទៅ​ខេត្តព្រៃវែង ដោយ​ទទួល​បាន​ភ្ញៀវ​ជាង​២,២​លាន​នាក់ ហើយ​កំពង់ស្ពឺ​ទទួល​បាន​លេខ​៣ ដោយ​ទទួលភ្ញៀវ​បាន​ចំនួន​ជាង​២,១​លាន​នាក់ ។ នេះ​បើ​តាម​ប្រភព​មន្ទីរ​ទេសចរណ៍​រាជធានី និង​ខេត្ត​នានា ។
ចំណែក​ខេត្តបាត់ដំបង ទទួលភ្ញៀវ​បាន​១,៧​លាន​នាក់ ដោយ​ជាប់​ចំណាត់ថ្នាក់​លេខ​៤ និង​ខេត្តកំពត​ទទួល​បាន​១,៤​លាន​នាក់ ដោយ​ជាប់​ចំណាត់ថ្នាក់​លេខ​៥ ។ គួរ​អោយ​កត់សម្គាល់​ទីក្រុង​ភ្នំពេញ​ទទួល​បាន​ភ្ញៀវ​ចំនួន​១,៣​លាន​នាក់ ហើយ​ខេត្តសៀមរាប​ទទួល​១,២​លាន​នាក់ និង​ខេត្ត​ព្រះ​សីហ​នុ​ទទួល​បាន ជាង ៦​សែន​នាក់ ។

ចូល​ឆ្នាំ​ខ្មែរ​លើក​នេះ គឺ​មាន​អ្នក​ដើរ​លេង​ច្រើន​ជាងគេ​បំផុត​ក្នុង​រយ​:​ពេល​ជា​ច្រើន​ឆ្នាំ​មកនេះ ។ រាជធានី និង​ខេត្ត​នានា​បាន​រៀបចំ​កម្មវិធី​បាន​យ៉ាង​ល្អ​ដើម្បី​អោយ​ប្រជាជន​សប្បាយ​បុណ្យចូលឆ្នាំ ៕
`.trim().replace(/\u200b/gm, "")


const debug = true;
const canvas = createCanvas(720 * 2, 512 * 2, SvgExportFlag.ConvertTextToPaths);
const ctx = canvas.getContext("2d");
const gapSize = 32;

ctx.fillStyle = 'hsl(45, 95%, 95%)';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.textBaseline = 'top';

const headline = new TextLayer("Text Justification Engine", {
  label: "headline",
  font: "32pt Geist Mono, sans-serif",
  lineHeight: 1,
  fillStyle: "black",
  x: 75,
  y: 75,
  debug,
}).layout(ctx).fill();

const layer = new TextLayer(TEXT_RAW, {
  label: "body",
  font: "17pt Noto Serif Khmer, sans-serif",
  lineHeight: 1.25,
  fillStyle: "black",
  textAlign: "justify",
  width: 600,
  x: headline.x,
  y: headline.bottom + gapSize,
  debug,
}).layout(ctx).fill();

const layer2 = new TextLayer(TEXT_RAW, {
  font: "18pt Kantumruy Pro, sans-serif",
  label: "body",
  lineHeight: 1.35,
  fillStyle: "black",
  textAlign: "justify",
  width: 700,
  x: layer.right + gapSize,
  y: layer.y,
  debug,
}).layout(ctx).fill();

new TextLayer("---[END OF LINE]---", {
  font: "32pt Geist Mono, sans-serif",
  label: "footer",
  lineHeight: 1,
  fillStyle: "black",
  x: layer.x,
  y: gapSize + Math.max(layer.bottom, layer2.bottom),
  width: (layer.w + layer2.w + gapSize),
  textAlign: 'center',
  debug,
}).layout(ctx).fill();


await fs.writeFile("outputs/image-svg.svg", optimize(canvas.getContent().toString()).data)