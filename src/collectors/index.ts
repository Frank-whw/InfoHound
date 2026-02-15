import { Collector, SourceConfig } from '../types';
import { RSSCollector } from './rss-collector';
import { HackerNewsCollector } from './hackernews-collector';

export function createCollector(config: SourceConfig): Collector {
  switch (config.id) {
    case 'hackernews':
      return new HackerNewsCollector(config);
    default:
      if (config.type === 'rss') {
        return new RSSCollector(config);
      }
      throw new Error(`Unknown collector type for source: ${config.id}`);
  }
}

export * from './rss-collector';
export * from './hackernews-collector';
