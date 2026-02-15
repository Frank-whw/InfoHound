import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Collector, RawArticle, Category, SourceConfig } from '../types';
import { ContentCache, logger } from '../utils';

const rssParser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'InfoHound/1.0 (Daily Tech Digest)',
  },
});

export class RSSCollector implements Collector {
  id: string;
  name: string;
  category: Category;
  weight: number;
  maxPerDay: number;

  private url: string;
  private filter?: SourceConfig['filter'];
  private cache: ContentCache;

  constructor(config: SourceConfig) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.weight = config.weight;
    this.maxPerDay = config.maxPerDay;
    this.url = config.url;
    this.filter = config.filter;
    this.cache = new ContentCache();
  }

  async fetch(): Promise<RawArticle[]> {
    logger.info(`Fetching RSS from ${this.name}...`);

    try {
      const feed = await rssParser.parseURL(this.url);
      const articles: RawArticle[] = [];

      for (const item of feed.items.slice(0, this.maxPerDay * 2)) {
        // Skip items without URL or title
        if (!item.link || !item.title) continue;

        // Filter by date (only last 48 hours)
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 48) continue;

        // Try to get full content
        let content = item['content:encoded'] || item.content || '';

        // If no content, try to fetch the page
        if (!content || content.length < 500) {
          try {
            content = await this.fetchArticleContent(item.link);
          } catch (err) {
            logger.warn(`Failed to fetch content for ${item.link}`);
          }
        }

        articles.push({
          id: this.hashUrl(item.link),
          title: item.title,
          url: item.link,
          content: content.slice(0, 15000), // Limit content length
          summary: item.contentSnippet || '',
          publishedAt: pubDate,
          source: this.id,
          sourceName: this.name,
          category: this.category,
        });

        if (articles.length >= this.maxPerDay) break;
      }

      logger.info(`Fetched ${articles.length} articles from ${this.name}`);
      return articles;
    } catch (error) {
      logger.error(`Error fetching ${this.name}:`, error);
      return [];
    }
  }

  private async fetchArticleContent(url: string): Promise<string> {
    return this.cache.getOrFetch(
      url,
      async () => {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; InfoHound/1.0)',
          },
        });

        const $ = cheerio.load(response.data);

        // Remove script, style, nav, footer, aside elements
        $('script, style, nav, footer, aside, .ads, .comments').remove();

        // Try to find main content
        const content =
          $('article').text() ||
          $('[role="main"]').text() ||
          $('.content').text() ||
          $('.post').text() ||
          $('main').text() ||
          $('body').text();

        return content.trim().slice(0, 10000);
      },
      24
    );
  }

  private hashUrl(url: string): string {
    return require('crypto').createHash('md5').update(url).digest('hex').slice(0, 12);
  }
}
