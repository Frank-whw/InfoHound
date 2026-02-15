import axios from 'axios';
import * as cheerio from 'cheerio';
import { Collector, RawArticle, Category, SourceConfig } from '../types';
import { ContentCache, logger } from '../utils';

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
}

export class HackerNewsCollector implements Collector {
  id: string;
  name: string;
  category: Category;
  weight: number;
  maxPerDay: number;

  private apiBase: string;
  private minScore: number;
  private cache: ContentCache;

  constructor(config: SourceConfig) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.weight = config.weight;
    this.maxPerDay = config.maxPerDay;
    this.apiBase = config.url;
    this.minScore = config.filter?.minScore || 100;
    this.cache = new ContentCache();
  }

  async fetch(): Promise<RawArticle[]> {
    logger.info(`Fetching top stories from Hacker News...`);

    try {
      // Get top stories IDs
      const topStoriesResponse = await axios.get<number[]>(
        `${this.apiBase}/topstories.json`
      );
      const topIds = topStoriesResponse.data.slice(0, 50);

      const articles: RawArticle[] = [];

      for (const id of topIds) {
        if (articles.length >= this.maxPerDay) break;

        try {
          const item = await this.fetchItem(id);
          if (!item || !item.url) continue;

          // Filter by score
          if ((item.score || 0) < this.minScore) continue;

          // Fetch content if needed
          let content = '';
          try {
            content = await this.fetchArticleContent(item.url);
          } catch {
            // Some URLs might not be fetchable, that's ok
          }

          articles.push({
            id: `hn-${item.id}`,
            title: item.title,
            url: item.url,
            content: content.slice(0, 15000),
            publishedAt: new Date((item.time || 0) * 1000),
            source: this.id,
            sourceName: this.name,
            category: this.category,
            metadata: {
              score: item.score,
              comments: item.descendants,
              author: item.by,
            },
          });
        } catch (err) {
          logger.warn(`Failed to fetch HN item ${id}:`, err);
          continue;
        }
      }

      logger.info(`Fetched ${articles.length} articles from Hacker News`);
      return articles;
    } catch (error) {
      logger.error('Error fetching Hacker News:', error);
      return [];
    }
  }

  private async fetchItem(id: number): Promise<HNItem | null> {
    const cacheKey = `hn-item-${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const response = await axios.get<HNItem>(
      `${this.apiBase}/item/${id}.json`
    );
    const item = response.data;

    await this.cache.set(cacheKey, JSON.stringify(item), 1);
    return item;
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
          maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, aside, .ads').remove();

        const content =
          $('article').text() ||
          $('[role="main"]').text() ||
          $('.content').text() ||
          $('main').text() ||
          $('body').text();

        return content.trim().slice(0, 10000);
      },
      24
    );
  }
}
