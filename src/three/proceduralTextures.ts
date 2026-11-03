import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generators
 * Fulfills physical PBR directives with sRGB color space & high anisotropy.
 */

// Cached textures to avoid repeated regeneration
let cachedWoodTexture: THREE.CanvasTexture | null = null;
let cachedSoilTexture: THREE.CanvasTexture | null = null;
let cachedPebbleTexture: THREE.CanvasTexture | null = null;
let cachedMossTexture: THREE.CanvasTexture | null = null;
let cachedShadowTexture: THREE.CanvasTexture | null = null;
let cachedLeafTexture: THREE.CanvasTexture | null = null;
let cachedCondensationTexture: THREE.CanvasTexture | null = null;

export function getProceduralWoodTexture(anisotropy = 4): THREE.CanvasTexture {
  if (cachedWoodTexture) return cachedWoodTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm walnut tone
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#2e1c12');
  baseGrad.addColorStop(0.5, '#42281a');
  baseGrad.addColorStop(1, '#24140d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric growth rings
  const centerX = 256;
  const centerY = 256;
  ctx.lineWidth = 1.2;

  for (let r = 5; r < 360; r += 2 + Math.random() * 3) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(18, 10, 6, ${0.12 + Math.random() * 0.18})`;
    for (let theta = 0; theta < Math.PI * 2; theta += 0.05) {
      // Wood grain perturbation
      const noise = Math.sin(theta * 6) * 3 + Math.cos(r * 0.08) * 2;
      const x = centerX + (r + noise) * Math.cos(theta);
      const y = centerY + (r + noise) * 0.85 * Math.sin(theta);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Micro fibers / rays
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const len = 30 + Math.random() * 120;
    const dist = 20 + Math.random() * 200;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(74, 45, 28, 0.2)';
    ctx.moveTo(centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist);
    ctx.lineTo(centerX + Math.cos(angle) * (dist + len), centerY + Math.sin(angle) * (dist + len));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  cachedWoodTexture = texture;
  return texture;
}

export function getProceduralSoilTexture(anisotropy = 4): THREE.CanvasTexture {
  if (cachedSoilTexture) return cachedSoilTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark rich organic peat soil base
  ctx.fillStyle = '#1c140d';
  ctx.fillRect(0, 0, 512, 512);

  // Organic particulate mottling
  for (let i = 0; i < 25000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 0.5 + Math.random() * 2.5;

    const shade = Math.random();
    if (shade < 0.45) {
      ctx.fillStyle = `rgba(15, 10, 6, ${0.4 + Math.random() * 0.4})`;
    } else if (shade < 0.8) {
      ctx.fillStyle = `rgba(45, 30, 18, ${0.3 + Math.random() * 0.4})`;
    } else if (shade < 0.93) {
      // Perlite specks (white/gray pumice)
      ctx.fillStyle = `rgba(160, 155, 140, ${0.25 + Math.random() * 0.35})`;
    } else {
      // Moss spores (green specks)
      ctx.fillStyle = `rgba(48, 82, 35, ${0.3 + Math.random() * 0.35})`;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = anisotropy;
  cachedSoilTexture = texture;
  return texture;
}

export function getProceduralPebbleTexture(anisotropy = 4): THREE.CanvasTexture {
  if (cachedPebbleTexture) return cachedPebbleTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a332c';
  ctx.fillRect(0, 0, 512, 512);

  // River pebbles in varied earth tones
  const colors = ['#6e6255', '#4d463e', '#7c6d5b', '#38312b', '#8b7a69', '#54504a', '#8a6245'];

  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rx = 8 + Math.random() * 16;
    const ry = 6 + Math.random() * 14;
    const rot = Math.random() * Math.PI;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Pebble shadow
    ctx.fillStyle = 'rgba(10, 8, 6, 0.5)';
    ctx.beginPath();
    ctx.ellipse(2, 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pebble body
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pebble specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.3, -ry * 0.3, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  cachedPebbleTexture = texture;
  return texture;
}

export function getProceduralMossTexture(anisotropy = 4): THREE.CanvasTexture {
  if (cachedMossTexture) return cachedMossTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e3814';
  ctx.fillRect(0, 0, 512, 512);

  // Velvety moss tufts
  const mossColors = ['#28521a', '#346b21', '#417d2a', '#1e3814', '#558f32', '#6dae3e', '#162e0f'];

  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.8 + Math.random() * 2.2;
    ctx.fillStyle = mossColors[Math.floor(Math.random() * mossColors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.anisotropy = anisotropy;
  cachedMossTexture = texture;
  return texture;
}

export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTexture) return cachedShadowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
  grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  cachedShadowTexture = texture;
  return texture;
}

export function getProceduralLeafTexture(): THREE.CanvasTexture {
  if (cachedLeafTexture) return cachedLeafTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5ea83b');
  grad.addColorStop(0.5, '#408026');
  grad.addColorStop(1, '#285417');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Central vein
  ctx.strokeStyle = 'rgba(164, 219, 114, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 256);
  ctx.quadraticCurveTo(126, 128, 128, 10);
  ctx.stroke();

  // Lateral veins
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(164, 219, 114, 0.35)';
  for (let y = 30; y < 240; y += 18) {
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.lineTo(40, y - 25);
    ctx.moveTo(128, y);
    ctx.lineTo(216, y - 25);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedLeafTexture = texture;
  return texture;
}

export function getGlassCondensationTexture(): THREE.CanvasTexture {
  if (cachedCondensationTexture) return cachedCondensationTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080'; // Neutral normal height
  ctx.fillRect(0, 0, 512, 512);

  // Droplet beads
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 6;

    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, '#a0a0a0');
    grad.addColorStop(1, '#606060');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Trickle trail for some droplets
    if (Math.random() < 0.25) {
      const trailLen = 15 + Math.random() * 45;
      ctx.strokeStyle = 'rgba(220, 220, 220, 0.4)';
      ctx.lineWidth = r * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + trailLen);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  cachedCondensationTexture = texture;
  return texture;
}
