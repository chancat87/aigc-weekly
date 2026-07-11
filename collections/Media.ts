import type { CollectionConfig } from 'payload'

import { revalidateWeeklyCache } from '@/lib/weekly/cache'

async function invalidateWeeklyCache<T>(doc: T): Promise<T> {
  await revalidateWeeklyCache()
  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [({ doc }) => invalidateWeeklyCache(doc)],
    afterDelete: [({ doc }) => invalidateWeeklyCache(doc)],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
}
