/** Lane-runner hit tests. No rendering deps so they can run under node --test. */

export function bodyTop(feetY, duck) {
  const standH = 1.68;
  const duckH = 0.84;
  const t = clamp(duck / 0.62, 0, 1);
  return feetY + standH + (duckH - standH) * t;
}

export function obstacleHits(feetY, topY, type, clearY, roofY) {
  if (type === 'low' || type === 'cable') return feetY < clearY;
  if (type === 'overhead') return topY > roofY;
  if (type === 'tall') return feetY < 2.35;
  return false;
}

export function inLane(px, laneX, allLanes, slack = 0.8) {
  if (allLanes) return true;
  return Math.abs(px - laneX) < slack;
}

export function inDepth(z, halfZ, pad = 0.32) {
  return Math.abs(z) < halfZ + pad;
}

/** Height of a platform under Mochi (world z = 0). Ramp rises from the near (-Z) end. */
export function platformSurface(centerZ, length, height, rampLen = 0) {
  const along = length * 0.5 - centerZ;
  if (along < -0.15 || along > length + 0.12) return null;
  const t = Math.max(0, Math.min(length, along));
  if (rampLen > 0 && t < rampLen) return (height * t) / rampLen;
  return height;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
