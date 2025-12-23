# RSS News Ingestion Setup and Operations Guide

## Overview

The Research Terminal uses RSS feeds to collect financial news from various sources. The system automatically fetches, parses, and tags news items, then displays them in the terminal interface.

## Architecture

- **RSS Sources**: Configured in the `rss_sources` database table
- **Ingestion**: Handled by Supabase Edge Function `ingest-rss`
- **Storage**: News items stored in `news_items` table with automatic tagging
- **Display**: Real-time updates via Supabase subscriptions

## RSS Feed Management

### Adding/Removing Feeds

Feeds are managed through the `rss_sources` table. Each feed has:

- `name`: Display name of the source
- `url`: RSS/Atom feed URL
- `region`: Geographic region (US, UK, EUROPE, ASIA_PACIFIC, CHINA, EMERGING_MARKETS, GLOBAL)
- `active`: Boolean flag to enable/disable
- `fetch_interval_minutes`: How often to check for updates (default 15 minutes)

#### Adding a New Feed

```sql
INSERT INTO rss_sources (name, url, region, active, fetch_interval_minutes)
VALUES ('New Source', 'https://example.com/rss', 'US', true, 15);
```

#### Disabling a Feed

```sql
UPDATE rss_sources SET active = false WHERE name = 'Source Name';
```

### Recommended RSS Sources

Financial news sources with good RSS feeds:

- Reuters: `https://feeds.reuters.com/reuters/businessNews`
- Bloomberg: `https://feeds.bloomberg.com/markets/news.rss`
- Financial Times: `https://www.ft.com/rss/home/uk`
- CNBC: `https://www.cnbc.com/id/100003114/device/rss/rss.html`
- Wall Street Journal: `https://feeds.a.dj.com/rss/RSSMarketsMain.xml`

## Configuration

### Environment Variables

No additional API keys required for public RSS feeds. The system uses:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `INTERNAL_CRON_SECRET`: Secret for authenticating ingestion requests

### Refresh Intervals

- **Default**: 15 minutes between checks
- **Minimum**: 5 minutes (to respect rate limits)
- **Maximum**: 60 minutes (to avoid missing breaking news)

Adjust based on source update frequency:

```sql
-- High-frequency sources (breaking news)
UPDATE rss_sources SET fetch_interval_minutes = 5 WHERE name = 'Reuters';

-- Low-frequency sources (daily summaries)
UPDATE rss_sources SET fetch_interval_minutes = 60 WHERE name = 'Weekly Digest';
```

## Running the System

### Local Development

1. Start Supabase locally:
   ```bash
   npx supabase start
   ```

2. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy ingest-rss
   ```

3. Run ingestion manually:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/ingest-rss \
     -H "Authorization: Bearer YOUR_INTERNAL_SECRET"
   ```

4. Start the Next.js app:
   ```bash
   npm run dev
   ```

### Production Deployment

1. Deploy to Supabase:
   ```bash
   npx supabase functions deploy ingest-rss
   ```

2. Set up cron job for regular ingestion:
   ```bash
   # Example: Run every 15 minutes
   */15 * * * * curl -X POST https://your-project.supabase.co/functions/v1/ingest-rss \
     -H "Authorization: Bearer YOUR_INTERNAL_SECRET"
   ```

## Monitoring and Troubleshooting

### Checking Feed Status

View recent ingestion logs:

```sql
SELECT rs.name, il.status, il.items_fetched, il.error_message, il.created_at
FROM ingestion_logs il
JOIN rss_sources rs ON il.feed_id = rs.id
ORDER BY il.created_at DESC
LIMIT 20;
```

### Common Issues

#### Feed Not Updating

1. Check if feed is active:
   ```sql
   SELECT name, active, last_fetched, last_error FROM rss_sources WHERE active = true;
   ```

2. Test feed URL manually:
   ```bash
   curl -I "https://example.com/rss"
   ```

3. Check for rate limiting or blocking

#### Parsing Errors

- Verify RSS/Atom format is valid
- Check for encoding issues (system expects UTF-8)
- Some feeds may have malformed XML

#### Database Errors

- Check Supabase logs for constraint violations
- Verify hash uniqueness for deduplication

### Performance Monitoring

Monitor ingestion performance:

```sql
-- Average items per feed
SELECT rs.name, AVG(il.items_fetched) as avg_items
FROM ingestion_logs il
JOIN rss_sources rs ON il.feed_id = rs.id
WHERE il.status = 'success'
GROUP BY rs.name;

-- Error rates
SELECT rs.name, COUNT(*) as total_attempts,
       SUM(CASE WHEN il.status = 'failed' THEN 1 ELSE 0 END) as failures
FROM ingestion_logs il
JOIN rss_sources rs ON il.feed_id = rs.id
WHERE il.created_at > NOW() - INTERVAL '24 hours'
GROUP BY rs.name;
```

## Rate Limits and Best Practices

### Respectful Fetching

- **Minimum interval**: 5 minutes between requests
- **User-Agent**: Identifies as "Research Terminal RSS Reader/1.0"
- **Conditional GET**: Uses ETag/Last-Modified headers to avoid unnecessary downloads
- **Timeout**: 30-second timeout prevents hanging requests

### Feed Quality Guidelines

- Prefer official RSS feeds over scraped content
- Choose feeds with consistent update patterns
- Monitor for feed stability and replace unreliable sources
- Balance between timeliness and server load

### Scaling Considerations

- Current system handles ~20 feeds with 15-minute intervals
- For more feeds, consider increasing intervals or implementing feed prioritization
- Monitor Supabase function execution time and memory usage

## Security Notes

- RSS ingestion runs with service role permissions
- Internal secret protects against unauthorized ingestion requests
- No sensitive data exposed in feed URLs
- All network requests include standard headers

## Future Enhancements

- Feed health scoring and automatic disabling
- Content filtering and spam detection
- Multi-language support
- Feed discovery and auto-categorization