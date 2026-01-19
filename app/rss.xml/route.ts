import process from 'node:process'
import RSS from 'rss'
import { siteConfig } from '@/lib/config'
import { renderMarkdown } from '@/lib/markdown'
import { getWeeklyList } from '@/lib/weekly/data'

export const revalidate = 3600 // 1h

export async function GET() {
  const weeklyResult = await getWeeklyList({ pageSize: 10 })
  const weeks = weeklyResult.items
  const baseUrl = siteConfig.metadataBase && siteConfig.metadataBase.toString().replace(/\/$/, '')

  const feed = new RSS({
    title: siteConfig.title,
    description: siteConfig.description,
    feed_url: `${baseUrl}/rss.xml`,
    site_url: baseUrl,
    image_url: `${baseUrl}/favicon.ico`,
    language: 'zh-CN',
    pubDate: new Date(),
    copyright: `Copyright ${new Date().getFullYear()} ${siteConfig.title}`,
    ttl: 1440, // 24 hours in minutes
  })

  weeks.forEach((week) => {
    feed.item({
      title: week.title,
      url: `${baseUrl}/weekly/${week.slug}`,
      guid: `${baseUrl}/weekly/${week.slug}`,
      date: new Date(week.publishDate),
      author: siteConfig.authors[0].name,
      description: week.summary,
      custom_elements: [
        {
          'content:encoded': {
            _cdata: `
              ${renderMarkdown(week.content)}
              ${process.env.NEXT_TRACKING_IMAGE ? `<img src="${process.env.NEXT_TRACKING_IMAGE}/${week.slug}" alt="${week.title}" width="1" height="1" loading="lazy" aria-hidden="true" style="opacity: 0;pointer-events: none;" />` : ''}
            `,
          },
        },
      ],
    })
  })

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `s-maxage=${revalidate}, max-age=${revalidate}, stale-while-revalidate`, // 1 week cache
    },
  })
}
