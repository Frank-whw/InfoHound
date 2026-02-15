import Anthropic from '@anthropic-ai/sdk';
import {
  RawArticle,
  ArticleScore,
  ArticleWithScore,
  ArticleSummary,
  AIService,
} from '../types';
import { logger } from '../utils';

export class ClaudeService implements AIService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  async evaluate(article: RawArticle): Promise<ArticleScore> {
    const prompt = `You are a senior tech editor evaluating article quality.

Article Title: ${article.title}
Article Content: ${article.content?.slice(0, 8000) || article.description || 'N/A'}
Source: ${article.sourceName}
Category: ${article.category}

Rate this article on 4 dimensions (1-10 scale):
1. novelty: How new/unique is the information?
2. depth: How deep is the analysis? Does it have data/cases?
3. practicality: Can readers get actionable insights?
4. relevance: How relevant for a tech-savvy reader interested in ${article.category}?

Respond in JSON format:
{
  "novelty": 8,
  "depth": 7,
  "practicality": 9,
  "relevance": 8,
  "reasoning": "Brief explanation of your ratings"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const scores = JSON.parse(jsonMatch[0]) as Omit<ArticleScore, 'overall'>;

      return {
        ...scores,
        overall: this.calculateOverall(scores),
      };
    } catch (error) {
      logger.error(`Error evaluating article ${article.title}:`, error);
      // Return default scores on error
      return {
        novelty: 5,
        depth: 5,
        practicality: 5,
        relevance: 5,
        overall: 5,
      };
    }
  }

  async summarize(article: ArticleWithScore): Promise<ArticleSummary> {
    const prompt = `Create a structured summary for this tech article.

Title: ${article.title}
Content: ${article.content?.slice(0, 10000) || article.description || 'N/A'}
Source: ${article.sourceName}
Quality Score: ${article.overallScore}/10

Generate:
1. whyItMatters: One sentence explaining WHY this is worth reading (not just what it's about)
2. oneSentenceSummary: The core point in one sentence
3. keyPoints: 3-5 bullet points with real insights (include specific data/cases when available)
4. background: Brief context if needed to understand (optional)
5. tags: 2-4 technical tags (e.g., "AI", "Backend", "React", "Security")
6. level: "beginner", "advanced", or "expert"

Respond in JSON format:
{
  "whyItMatters": "...",
  "oneSentenceSummary": "...",
  "keyPoints": ["...", "...", "..."],
  "background": "...",
  "tags": ["tag1", "tag2"],
  "level": "advanced"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const summary = JSON.parse(jsonMatch[0]) as ArticleSummary;

      // Ensure level is valid
      if (!['beginner', 'advanced', 'expert'].includes(summary.level)) {
        summary.level = 'advanced';
      }

      return summary;
    } catch (error) {
      logger.error(`Error summarizing article ${article.title}:`, error);
      // Return basic summary on error
      return {
        whyItMatters: `Article about ${article.title}`,
        oneSentenceSummary: article.description || article.title,
        keyPoints: [article.description || 'See original article'],
        tags: [article.category as string],
        level: 'advanced' as const,
      };
    }
  }

  private calculateOverall(scores: Omit<ArticleScore, 'overall'>): number {
    // Weight: depth (30%) + practicality (30%) + novelty (20%) + relevance (20%)
    return Number(
      (
        scores.novelty * 0.2 +
        scores.depth * 0.3 +
        scores.practicality * 0.3 +
        scores.relevance * 0.2
      ).toFixed(1)
    );
  }
}
