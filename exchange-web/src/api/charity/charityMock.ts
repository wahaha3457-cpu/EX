import type { CharityCampaign } from '@/types/charity'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function charityCoverUrl(seed: string, w = 640, h = 360) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

const CAMPAIGNS: CharityCampaign[] = [
  {
    slug: 'edu-rural-library',
    category: 'EDUCATION',
    status: 'ACTIVE',
    raisedUsdt: 428_500,
    goalUsdt: 800_000,
    donors: 3120,
    coverSeed: 'ch-edu-library',
    regionKey: 'asia',
    endAt: new Date(Date.now() + 45 * 86400_000).toISOString(),
  },
  {
    slug: 'disaster-flood-2025',
    category: 'DISASTER',
    status: 'ACTIVE',
    raisedUsdt: 1_020_000,
    goalUsdt: 1_500_000,
    donors: 8901,
    coverSeed: 'ch-disaster-flood',
    regionKey: 'sea',
    endAt: new Date(Date.now() + 12 * 86400_000).toISOString(),
  },
  {
    slug: 'env-reforest',
    category: 'ENVIRONMENT',
    status: 'ACTIVE',
    raisedUsdt: 256_000,
    goalUsdt: 600_000,
    donors: 1540,
    coverSeed: 'ch-env-forest',
    regionKey: 'latam',
    endAt: new Date(Date.now() + 90 * 86400_000).toISOString(),
  },
  {
    slug: 'children-lunch',
    category: 'CHILDREN',
    status: 'COMPLETED',
    raisedUsdt: 500_000,
    goalUsdt: 500_000,
    donors: 12000,
    coverSeed: 'ch-child-lunch',
    regionKey: 'africa',
    endAt: null,
  },
  {
    slug: 'health-vaccine',
    category: 'HEALTH',
    status: 'COMPLETED',
    raisedUsdt: 750_000,
    goalUsdt: 720_000,
    donors: 6700,
    coverSeed: 'ch-health-vax',
    regionKey: 'global',
    endAt: null,
  },
  {
    slug: 'water-wells',
    category: 'HEALTH',
    status: 'ACTIVE',
    raisedUsdt: 188_000,
    goalUsdt: 400_000,
    donors: 2100,
    coverSeed: 'ch-water',
    regionKey: 'africa',
    endAt: new Date(Date.now() + 60 * 86400_000).toISOString(),
  },
]

export async function fetchCharityHub(): Promise<{
  campaigns: CharityCampaign[]
  stats: { totalRaisedUsdt: number; totalDonors: number; projectCount: number }
}> {
  await delay(200)
  const totalRaisedUsdt = CAMPAIGNS.reduce((s, c) => s + c.raisedUsdt, 0)
  const totalDonors = CAMPAIGNS.reduce((s, c) => s + c.donors, 0)
  return {
    campaigns: [...CAMPAIGNS].sort((a, b) => b.raisedUsdt - a.raisedUsdt),
    stats: {
      totalRaisedUsdt,
      totalDonors,
      projectCount: CAMPAIGNS.length,
    },
  }
}

export function getCampaignBySlug(slug: string): CharityCampaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug)
}
