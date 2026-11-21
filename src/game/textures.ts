import * as THREE from 'three';

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export interface ProceduralTextureSet {
  groundColor: THREE.CanvasTexture;
  groundBump: THREE.CanvasTexture;
  stoneColor: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  woodColor: THREE.CanvasTexture;
  runeEmissive: THREE.CanvasTexture;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Mossy cobblestone / highland earth ground
  const [gc, gctx] = createCanvas(512);
  gctx.fillStyle = '#252a24';
  gctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 4;
    const isMoss = Math.random() < 0.32;
    const shade = 28 + Math.floor(Math.random() * 24);
    gctx.fillStyle = isMoss
      ? `rgb(${28 + Math.floor(Math.random() * 18)}, ${46 + Math.floor(Math.random() * 24)}, ${30 + Math.floor(Math.random() * 14)})`
      : `rgb(${shade + 4}, ${shade + 2}, ${shade - 2})`;
    gctx.beginPath();
    gctx.arc(x, y, r, 0, Math.PI * 2);
    gctx.fill();
  }

  // Subtle stone paving patches
  gctx.strokeStyle = 'rgba(15, 18, 16, 0.35)';
  gctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (Math.random() < 0.45) {
        const px = col * 64 + (row % 2) * 18;
        const py = row * 64;
        gctx.fillStyle = 'rgba(72, 74, 68, 0.18)';
        gctx.fillRect(px + 3, py + 3, 56, 56);
        gctx.strokeRect(px + 3, py + 3, 56, 56);
      }
    }
  }

  const groundColor = new THREE.CanvasTexture(gc);
  groundColor.colorSpace = THREE.SRGBColorSpace;
  groundColor.wrapS = groundColor.wrapT = THREE.RepeatWrapping;
  groundColor.repeat.set(28, 28);
  groundColor.anisotropy = maxAnisotropy;

  // Ground bump
  const [gb, gbctx] = createCanvas(256);
  gbctx.fillStyle = '#808080';
  gbctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2800; i++) {
    const v = 90 + Math.floor(Math.random() * 80);
    gbctx.fillStyle = `rgb(${v},${v},${v})`;
    gbctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const groundBump = new THREE.CanvasTexture(gb);
  groundBump.wrapS = groundBump.wrapT = THREE.RepeatWrapping;
  groundBump.repeat.set(28, 28);

  // 2. Weathered ruin stone blocks
  const [sc, sctx] = createCanvas(512);
  sctx.fillStyle = '#47494e';
  sctx.fillRect(0, 0, 512, 512);
  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * 64;
    for (let c = -1; c < 5; c++) {
      const x = c * 128 + offset;
      const y = r * rowH;
      const tone = 62 + Math.floor(Math.random() * 22);
      sctx.fillStyle = `rgb(${tone}, ${tone + 1}, ${tone + 4})`;
      sctx.fillRect(x + 3, y + 3, 122, rowH - 6);
      // Weathering specks
      for (let k = 0; k < 45; k++) {
        sctx.fillStyle = Math.random() > 0.5 ? 'rgba(20,22,26,0.22)' : 'rgba(130,135,140,0.14)';
        sctx.fillRect(x + 4 + Math.random() * 116, y + 4 + Math.random() * (rowH - 10), 4, 4);
      }
      // Occasional moss streak
      if (Math.random() < 0.25) {
        sctx.fillStyle = 'rgba(54, 78, 48, 0.38)';
        sctx.fillRect(x + 8, y + rowH - 14, 40 + Math.random() * 50, 9);
      }
    }
  }
  const stoneColor = new THREE.CanvasTexture(sc);
  stoneColor.colorSpace = THREE.SRGBColorSpace;
  stoneColor.wrapS = stoneColor.wrapT = THREE.RepeatWrapping;
  stoneColor.repeat.set(2, 2);
  stoneColor.anisotropy = maxAnisotropy;

  const [sb, sbctx] = createCanvas(256);
  sbctx.fillStyle = '#909090';
  sbctx.fillRect(0, 0, 256, 256);
  sbctx.strokeStyle = '#303030';
  sbctx.lineWidth = 4;
  for (let r = 0; r < 8; r++) {
    const y = r * 32;
    sbctx.beginPath();
    sbctx.moveTo(0, y);
    sbctx.lineTo(256, y);
    sbctx.stroke();
  }
  const stoneBump = new THREE.CanvasTexture(sb);
  stoneBump.wrapS = stoneBump.wrapT = THREE.RepeatWrapping;
  stoneBump.repeat.set(2, 2);

  // 3. Carved dark oak wood
  const [wc, wctx] = createCanvas(256);
  wctx.fillStyle = '#4b311e';
  wctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) {
    wctx.strokeStyle = i % 2 === 0 ? 'rgba(30,18,10,0.35)' : 'rgba(105,72,44,0.25)';
    wctx.lineWidth = 1 + Math.random() * 2;
    const y = Math.random() * 256;
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.bezierCurveTo(85, y + (Math.random() - 0.5) * 10, 170, y + (Math.random() - 0.5) * 10, 256, y);
    wctx.stroke();
  }
  const woodColor = new THREE.CanvasTexture(wc);
  woodColor.colorSpace = THREE.SRGBColorSpace;
  woodColor.anisotropy = maxAnisotropy;

  // 4. Arcane Rune Ring texture
  const [rc, rctx] = createCanvas(256);
  rctx.clearRect(0, 0, 256, 256);
  rctx.strokeStyle = '#60a5fa';
  rctx.lineWidth = 4;
  rctx.beginPath();
  rctx.arc(128, 128, 108, 0, Math.PI * 2);
  rctx.stroke();
  rctx.lineWidth = 2;
  rctx.beginPath();
  rctx.arc(128, 128, 84, 0, Math.PI * 2);
  rctx.stroke();
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    const x1 = 128 + Math.cos(ang) * 86;
    const y1 = 128 + Math.sin(ang) * 86;
    const x2 = 128 + Math.cos(ang) * 106;
    const y2 = 128 + Math.sin(ang) * 106;
    rctx.beginPath();
    rctx.moveTo(x1, y1);
    rctx.lineTo(x2, y2);
    rctx.stroke();
  }
  const runeEmissive = new THREE.CanvasTexture(rc);
  runeEmissive.colorSpace = THREE.SRGBColorSpace;

  return {
    groundColor,
    groundBump,
    stoneColor,
    stoneBump,
    woodColor,
    runeEmissive,
  };
}
