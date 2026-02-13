export type LayoutDensity = 'low' | 'medium' | 'high';

export interface GraphLayoutInput {
  id: string;
  cluster: string;
  degree: number;
}

export interface GraphLayoutPosition {
  x: number;
  y: number;
  z: number;
}

const DENSITY_SETTINGS: Record<LayoutDensity, { ring: number; spread: number; jitter: number }> = {
  low: { ring: 2.2, spread: 1.4, jitter: 0.6 },
  medium: { ring: 1.7, spread: 1.1, jitter: 0.45 },
  high: { ring: 1.3, spread: 0.9, jitter: 0.35 },
};

function hashSeed(value: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0) / 4294967295;
}

export function buildOrbitalLayout(
  nodes: GraphLayoutInput[],
  density: LayoutDensity = 'medium'
): Record<string, GraphLayoutPosition> {
  const settings = DENSITY_SETTINGS[density];
  const clusters = Array.from(new Set(nodes.map((node) => node.cluster || 'general')));
  const clusterIndex = new Map(clusters.map((cluster, index) => [cluster, index]));

  const positions: Record<string, GraphLayoutPosition> = {};
  nodes.forEach((node) => {
    const index = clusterIndex.get(node.cluster || 'general') ?? 0;
    const angle = hashSeed(node.id, 19) * Math.PI * 2;
    const elevation = (hashSeed(node.id, 29) - 0.5) * settings.spread;
    const jitter = (hashSeed(node.id, 41) - 0.5) * settings.jitter;
    const ringRadius = 1.6 + index * settings.ring + Math.min(node.degree * 0.08, 1.2) + jitter;
    const x = Math.cos(angle) * ringRadius;
    const z = Math.sin(angle) * ringRadius;
    const y = elevation + (hashSeed(node.id, 53) - 0.5) * 0.4;
    positions[node.id] = { x, y, z };
  });
  return positions;
}
