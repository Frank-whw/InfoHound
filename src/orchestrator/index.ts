import { ArticleWithSummary, DailyDigest, Section, Category } from '../types';

interface SectionConfig {
  name: string;
  icon: string;
}

const CATEGORY_CONFIG: Record<Category, SectionConfig> = {
  'tech-deep': { name: '深度技术', icon: '🔥' },
  'product': { name: '产品 & 创业', icon: '🚀' },
  'ai': { name: 'AI & 研究', icon: '🤖' },
  'chinese': { name: '中文精选', icon: '🌏' },
};

export class Orchestrator {
  orchestrate(articles: ArticleWithSummary[]): DailyDigest {
    // 1. Sort by overall score
    const sorted = [...articles].sort((a, b) => b.overallScore - a.overallScore);

    // 2. Select headline (highest score)
    const headline = sorted[0];

    // 3. Group by category
    const byCategory = this.groupByCategory(sorted.slice(1));

    // 4. Create sections
    const sections: Section[] = [];
    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      const catArticles = byCategory[category as Category] || [];
      if (catArticles.length > 0) {
        sections.push({
          ...config,
          articles: catArticles.slice(0, 3), // Max 3 per category
        });
      }
    }

    // 5. Calculate stats
    const stats = {
      totalArticles: articles.length,
      averageScore: this.calculateAverageScore(articles),
      estimatedReadTime: Math.ceil(articles.length * 1.5), // ~1.5 min per article
    };

    return {
      date: new Date(),
      headline,
      sections,
      stats,
    };
  }

  private groupByCategory(
    articles: ArticleWithSummary[]
  ): Record<Category, ArticleWithSummary[]> {
    const grouped: Partial<Record<Category, ArticleWithSummary[]>> = {};

    for (const article of articles) {
      if (!grouped[article.category]) {
        grouped[article.category] = [];
      }
      grouped[article.category]!.push(article);
    }

    return grouped as Record<Category, ArticleWithSummary[]>;
  }

  private calculateAverageScore(articles: ArticleWithSummary[]): number {
    if (articles.length === 0) return 0;
    const sum = articles.reduce((acc, a) => acc + a.overallScore, 0);
    return Number((sum / articles.length).toFixed(1));
  }
}
