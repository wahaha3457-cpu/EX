import type { NftCollection, NftItem, NftMarketStats } from '@/types/nft'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function img(seed: string, w = 480, h = 480) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

export const NFT_COLLECTIONS: NftCollection[] = [
  {
    id: 'col-lunar',
    slug: 'lunar-primates',
    name: 'Lunar Primates',
    coverSeed: 'nft-col-lunar',
    chain: 'BSC',
    items: 8888,
    verified: true,
  },
  {
    id: 'col-neon',
    slug: 'neon-grid',
    name: 'Neon Grid City',
    coverSeed: 'nft-col-neon',
    chain: 'ETH',
    items: 3333,
    verified: true,
  },
  {
    id: 'col-zen',
    slug: 'zen-garden',
    name: 'Zen Garden Spirits',
    coverSeed: 'nft-col-zen',
    chain: 'POLYGON',
    items: 5000,
    verified: false,
  },
  {
    id: 'col-orbit',
    slug: 'orbit-racers',
    name: 'Orbit Racers',
    coverSeed: 'nft-col-orbit',
    chain: 'BSC',
    items: 12000,
    verified: true,
  },
  {
    id: 'col-pixel',
    slug: 'pixel-legends',
    name: 'Pixel Legends',
    coverSeed: 'nft-col-pixel',
    chain: 'ETH',
    items: 2048,
    verified: true,
  },
  {
    id: 'col-meta',
    slug: 'meta-atelier',
    name: 'Meta Atelier',
    coverSeed: 'nft-col-meta',
    chain: 'BSC',
    items: 4096,
    verified: false,
  },
]

function buildItems(): NftItem[] {
  const base: Omit<NftItem, 'id' | 'slug' | 'title' | 'imageSeed' | 'traits'>[] = [
    {
      collectionId: 'col-lunar',
      collectionName: 'Lunar Primates',
      chain: 'BSC',
      category: 'PFP',
      verified: true,
      creator: 'LunarLabs',
      description:
        'Genesis PFP collection on BNB Chain. Holder benefits include airdrops and governance (demo copy).',
    },
    {
      collectionId: 'col-neon',
      collectionName: 'Neon Grid City',
      chain: 'ETH',
      category: 'ART',
      verified: true,
      creator: 'Studio Neon',
      description: 'Generative cityscapes with neon palettes. Each piece is unique (demo).',
    },
    {
      collectionId: 'col-zen',
      collectionName: 'Zen Garden Spirits',
      chain: 'POLYGON',
      category: 'ART',
      verified: false,
      creator: 'ZenDAO',
      description: 'Calm, meditative compositions inspired by Japanese gardens.',
    },
    {
      collectionId: 'col-orbit',
      collectionName: 'Orbit Racers',
      chain: 'BSC',
      category: 'GAME',
      verified: true,
      creator: 'Orbit Games',
      description: 'Racing skins usable in the Orbit Racers demo metaverse.',
    },
    {
      collectionId: 'col-pixel',
      collectionName: 'Pixel Legends',
      chain: 'ETH',
      category: 'PFP',
      verified: true,
      creator: 'Pixel Guild',
      description: '8-bit heroes with on-chain traits.',
    },
    {
      collectionId: 'col-meta',
      collectionName: 'Meta Atelier',
      chain: 'BSC',
      category: 'METAVERSE',
      verified: false,
      creator: 'Atelier Team',
      description: 'Wearables and props for virtual galleries.',
    },
  ]

  const out: NftItem[] = []
  let n = 0
  for (let v = 0; v < base.length; v++) {
    const b = base[v]!
    for (let i = 0; i < 4; i++) {
      n += 1
      const id = `nft-${n}`
      out.push({
        ...b,
        id,
        slug: `${b.collectionId}-${i + 1}`,
        title: `${b.collectionName} #${1000 + n}`,
        imageSeed: `nft-item-${id}`,
        traits: [
          { traitType: 'Background', value: ['Aurora', 'Midnight', 'Sand', 'Forest'][i % 4]! },
          { traitType: 'Rarity', value: ['Common', 'Rare', 'Epic', 'Legendary'][n % 4]! },
        ],
      })
    }
  }
  return out
}

export const NFT_ITEMS = buildItems()

export function getNftImageUrl(seed: string) {
  return img(seed)
}

export async function fetchNftMarket(): Promise<{
  items: NftItem[]
  collections: NftCollection[]
  stats: NftMarketStats
}> {
  await delay(220)
  return {
    items: NFT_ITEMS,
    collections: NFT_COLLECTIONS,
    stats: {
      volume24hUsdt: 2_860_000,
      traders24h: 12840,
      listed: NFT_ITEMS.length,
    },
  }
}

export function getNftItemById(id: string): NftItem | undefined {
  return NFT_ITEMS.find((x) => x.id === id)
}
