// Article types at different stages of processing

export interface RawArticle {
  id: string;
  title: string;
  url: string;
  content?: string;
  summary?: string;
  publishedAt: Date;
  source: string;
  sourceName: string;
  category: Category;
  metadata?: Record<string, any>;
}

export interface ArticleScore {
  novelty: number;        // 1-10: How new/unique is the information
  depth: number;          // 1-10: Depth of analysis
  practicality: number;   // 1-10: Practical value
  relevance: number;      // 1-10: Relevance to reader interests
  overall: number;        // Weighted average
}

export interface ArticleWithScore extends RawArticle {
  scores: ArticleScore;
  overallScore: number;
}

export interface ArticleSummary {
  whyItMatters: string;      // One sentence on why it's important
  oneSentenceSummary: string; // Core point in one sentence
  keyPoints: string[];       // 3-5 key insights
  background?: string;       // Context if needed
  tags: string[];            // Technical tags
  level: 'beginner' | 'advanced' | 'expert';
}

export interface ArticleWithSummary extends ArticleWithScore {
  summary: ArticleSummary;
}

// Source configuration
export type Category = 'tech-deep' | 'product' | 'ai' | 'chinese';

export interface SourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api';
  url: string;
  category: Category;
  weight: number;
  maxPerDay: number;
  filter?: {
    minScore?: number;
    keywords?: string[];
    excludeKeywords?: string[];
  };
}

// Collector interface
export interface Collector {
  id: string;
  name: string;
  category: Category;
  weight: number;
  maxPerDay: number;
  fetch(): Promise<RawArticle[]>;
}

// Daily digest output
export interface Section {
  name: string;
  icon: string;
  articles: ArticleWithSummary[];
}

export interface DailyDigest {
  date: Date;
  headline: ArticleWithSummary;
  sections: Section[];
  stats: {
    totalArticles: number;
    averageScore: number;
    estimatedReadTime: number;
  };
}

// AI Service
export interface AIService {
  evaluate(article: RawArticle): Promise<ArticleScore>;
  summarize(article: ArticleWithScore): Promise<ArticleSummary>;
}

// Cache
export interface CacheEntry {
  content: string;
  expiresAt: number;
}
