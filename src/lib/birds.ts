export const BIRDS = ['sparrow', 'robin', 'owl', 'bluetit', 'duck', 'kingfisher'] as const
export type Bird = (typeof BIRDS)[number]

export const BIRD_NAMES: Record<Bird, string> = {
  sparrow: 'Sparrow',
  robin: 'Robin',
  owl: 'Owl',
  bluetit: 'Blue tit',
  duck: 'Duckling',
  kingfisher: 'Kingfisher',
}
