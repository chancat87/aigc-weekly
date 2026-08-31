import process from 'node:process'

const WSRV_URL = 'https://wsrv.nl/'

function createWsrvUrl(sourceUrl, params) {
  const searchParams = new URLSearchParams({ url: sourceUrl })
  for (const [key, value] of Object.entries(params))
    searchParams.set(key, String(value))
  return `${WSRV_URL}?${searchParams}`
}

function createPreviewUrl(sourceUrl) {
  return createWsrvUrl(sourceUrl, {
    w: 768,
    h: 432,
    fit: 'inside',
    output: 'webp',
    q: 75,
  })
}

function createFinalUrl(sourceUrl) {
  return createWsrvUrl(sourceUrl, {
    w: 1200,
    output: 'webp',
    q: 80,
    maxage: '1y',
  })
}

const [command, sourceUrl] = process.argv.slice(2)

if (!sourceUrl || !['preview', 'final'].includes(command)) {
  process.stderr.write('用法: image-utils.mjs preview <url> | final <url>\n')
  process.exit(1)
}

const result = command === 'preview'
  ? createPreviewUrl(sourceUrl)
  : createFinalUrl(sourceUrl)

process.stdout.write(`${result}\n`)
