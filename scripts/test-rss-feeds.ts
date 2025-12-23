/**
 * RSS Feed Validator
 * Tests which feeds are actually working before seeding the database
 */

const CANDIDATE_FEEDS = [
  { url: 'https://www.reuters.com/rssFeed/businessNews', name: 'Reuters Business', category: 'markets' },
  { url: 'https://www.reuters.com/rssFeed/economicsNews', name: 'Reuters Economics', category: 'policy' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', name: 'MarketWatch Top Stories', category: 'markets' },
  { url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', name: 'MarketWatch Market Pulse', category: 'markets' },
  { url: 'https://finance.yahoo.com/news/rssindex', name: 'Yahoo Finance News', category: 'markets' },
  { url: 'https://seekingalpha.com/feed.xml', name: 'Seeking Alpha Latest', category: 'markets' },
  { url: 'https://www.federalreserve.gov/feeds/press_all.xml', name: 'Federal Reserve Press', category: 'policy' },
  { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com General', category: 'markets' },
  { url: 'https://www.ft.com/companies?format=rss', name: 'FT Companies', category: 'corporate' },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', name: 'WSJ Markets', category: 'markets' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk', category: 'markets' },
]

async function testFeed(feed: { url: string; name: string; category: string }) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!response.ok) {
      return { ...feed, status: 'FAILED', error: `HTTP ${response.status}`, itemCount: 0 }
    }

    const text = await response.text()
    
    // Check if it's valid RSS/Atom
    const isRss = text.includes('<rss') || text.includes('<feed')
    if (!isRss) {
      return { ...feed, status: 'INVALID', error: 'Not RSS/Atom format', itemCount: 0 }
    }

    // Count items
    const itemCount = (text.match(/<item>|<entry>/g) || []).length

    if (itemCount === 0) {
      return { ...feed, status: 'EMPTY', error: 'No items found', itemCount: 0 }
    }

    return { ...feed, status: 'SUCCESS', error: null, itemCount }
  } catch (error) {
    return { 
      ...feed, 
      status: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error',
      itemCount: 0 
    }
  }
}

async function main() {
  console.log('🔍 Testing RSS feeds...\n')
  console.log('='.repeat(80))
  
  const results = await Promise.all(CANDIDATE_FEEDS.map(testFeed))
  
  const working = results.filter(r => r.status === 'SUCCESS')
  const failed = results.filter(r => r.status !== 'SUCCESS')
  
  console.log('\n✅ WORKING FEEDS:\n')
  working.forEach(r => {
    console.log(`  ✓ ${r.name.padEnd(30)} (${r.itemCount} items)`)
    console.log(`    ${r.url}`)
  })
  
  console.log('\n\n❌ FAILED FEEDS:\n')
  failed.forEach(r => {
    console.log(`  ✗ ${r.name.padEnd(30)} - ${r.error}`)
    console.log(`    ${r.url}`)
  })
  
  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 Summary: ${working.length}/${results.length} feeds working\n`)
  
  // Generate SQL for working feeds
  if (working.length > 0) {
    console.log('\n📝 SQL Migration (copy to supabase/migrations/):\n')
    console.log('```sql')
    console.log('INSERT INTO rss_sources (url, name, category, is_active) VALUES')
    const values = working.map((r, i) => {
      const isLast = i === working.length - 1
      return `  ('${r.url}', '${r.name}', '${r.category}', true)${isLast ? ';' : ','}`
    })
    console.log(values.join('\n'))
    console.log('```')
  }
}

main()
