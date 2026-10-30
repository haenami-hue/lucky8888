// PWA 설치용 PNG 아이콘(192, 512, 512 maskable)을 외부 도구 없이 생성한다.
// icon.svg 와 같은 디자인(그라데이션 배경 + 노란 로또공 + 하트)을 픽셀로 그린다.
//   node scripts/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/icons");

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => c1.map((v, i) => lerp(v, c2[i], t));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG = ["#ff4d8d", "#ff7a59", "#ffb02e"].map(hex);
const BALL = ["#fff6c2", "#ffd84a", "#e0a800"].map(hex);
const PINK = hex("#ff4d8d");

function gradient3(stops, t) {
  return t < 0.5 ? mix(stops[0], stops[1], t * 2) : mix(stops[1], stops[2], (t - 0.5) * 2);
}

/** 단위 좌표(0~512) 한 점의 색. 투명이면 null */
function shade(x, y, maskable) {
  const rr = maskable ? 0 : 112;
  // 둥근 모서리 사각형 밖이면 투명
  const cx = Math.min(Math.max(x, rr), 512 - rr);
  const cy = Math.min(Math.max(y, rr), 512 - rr);
  if (rr && (x - cx) ** 2 + (y - cy) ** 2 > rr * rr) return null;

  // maskable 은 안전영역(가운데 80%) 안에 들어가도록 공을 줄인다
  const s = maskable ? 0.78 : 1;
  const dx = (x - 256) / s;
  const dy = (y - 256) / s;
  const d = Math.hypot(dx, dy);

  if (d <= 78) {
    // 하트: 두 원 + 아래 삼각형
    const hx = dx, hy = dy + 6;
    const inHeart =
      Math.hypot(hx + 18, hy + 14) <= 22 || Math.hypot(hx - 18, hy + 14) <= 22 ||
      (hy >= -14 && hy <= 34 && Math.abs(hx) <= (34 - hy) * 1.15);
    return inHeart ? PINK : [255, 255, 255];
  }
  if (d <= 150) {
    const t = Math.min(Math.hypot(dx + 45, dy + 60) / 210, 1);
    return gradient3(BALL, t);
  }
  return gradient3(BG, (x + y) / 1024);
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, maskable) {
  const SS = 3; // 안티앨리어싱용 슈퍼샘플링
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = shade(((px + (sx + 0.5) / SS) * 512) / size, ((py + (sy + 0.5) / SS) * 512) / size, maskable);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
        }
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      raw[o] = a ? r / a : 0;
      raw[o + 1] = a ? g / a : 0;
      raw[o + 2] = a ? b / a : 0;
      raw[o + 3] = (a / (SS * SS)) * 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(`${OUT}/icon-192.png`, png(192, false));
writeFileSync(`${OUT}/icon-512.png`, png(512, false));
writeFileSync(`${OUT}/icon-512-maskable.png`, png(512, true));
console.log("아이콘 생성 완료:", OUT);
