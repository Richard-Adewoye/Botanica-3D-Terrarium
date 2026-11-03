import { CreatureSpecimen } from '../types/terrarium';

export const INITIAL_CREATURES: CreatureSpecimen[] = [
  {
    id: 'beetle-1',
    name: 'Emerald Jewel Beetle',
    scientificName: 'Chrysochroa fulgidissima',
    type: 'beetle',
    position: [0.12, 0.0, -0.05],
    rotationY: 0.8,
    scale: 0.85,
    activityLevel: 85,
    description: 'An iridescent forest beetle that wanders along wood bark and foliage, aerating miniature soil pockets.',
  },
  {
    id: 'snail-1',
    name: 'Amber Glass Snail',
    scientificName: 'Succinea putris',
    type: 'snail',
    position: [-0.28, 0.0, 0.35],
    rotationY: -1.2,
    scale: 0.9,
    activityLevel: 60,
    description: 'A translucent moss-dwelling snail with responsive sensory eye stalks that glides gently across humid substrate.',
  },
];
