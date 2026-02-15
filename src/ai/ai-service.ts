import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  RawArticle,
  ArticleScore,
  ArticleWithScore,
  ArticleSummary,
  AIService,
} from '../types';
import { logger } from '../utils';

export { AIService } from '../types';

export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'openrouter' | 'deepseek' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

abstract class BaseAIService implements AIService {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract evaluate(article: RawArticle): Promise<ArticleScore>;
  abstract summarize(article: ArticleWithScore): Promise<ArticleSummary>;

  protected calculateOverall(scores: Omit<ArticleScore, 'overall'>): number {
    return Number(
      (
        scores.novelty * 0.2 +
        scores.depth * 0.3 +
        scores.practicality * 0.3 +
        scores.relevance * 0.2
      ).toFixed(1)
    );
  }

  protected createEvaluationPrompt(article: RawArticle): string {
    return `You are a senior tech editor evaluating article quality.

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
  }

  protected createSummarizationPrompt(article: ArticleWithScore): string {
    return `Create a structured summary for this tech article.

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
  }

  protected parseJSONFromResponse(content: string): any {
    // Try to extract JSON from markdown code blocks first
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // Try to find JSON object directly
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No JSON found in response');
  }
}

// Anthropic Claude Implementation
class AnthropicService extends BaseAIService {
  private client: Anthropic;

  constructor(config: AIConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async evaluate(article: RawArticle): Promise<ArticleScore> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: 'user', content: this.createEvaluationPrompt(article) }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      const scores = this.parseJSONFromResponse(content);

      return {
        ...scores,
        overall: this.calculateOverall(scores),
      };
    } catch (error) {
      logger.error(`Error evaluating article ${article.title}:`, error);
      return this.getDefaultScores();
    }
  }

  async summarize(article: ArticleWithScore): Promise<ArticleSummary> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: 'user', content: this.createSummarizationPrompt(article) }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      const summary = this.parseJSONFromResponse(content);

      // Ensure level is valid
      if (!['beginner', 'advanced', 'expert'].includes(summary.level)) {
        summary.level = 'advanced';
      }

      return summary;
    } catch (error) {
      logger.error(`Error summarizing article ${article.title}:`, error);
      return this.getDefaultSummary(article);
    }
  }

  private getDefaultScores(): ArticleScore {
    return {
      novelty: 5,
      depth: 5,
      practicality: 5,
      relevance: 5,
      overall: 5,
    };
  }

  private getDefaultSummary(article: ArticleWithScore): ArticleSummary {
    return {
      whyItMatters: `Article about ${article.title}`,
      oneSentenceSummary: article.description || article.title,
      keyPoints: [article.description || 'See original article'],
      tags: [article.category as string],
      level: 'advanced' as const,
    };
  }
}

// OpenAI-compatible Implementation (OpenAI, OpenRouter, DeepSeek, etc.)
class OpenAICompatibleService extends BaseAIService {
  private client: OpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async evaluate(article: RawArticle): Promise<ArticleScore> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: 'user', content: this.createEvaluationPrompt(article) }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const scores = JSON.parse(content);

      return {
        ...scores,
        overall: this.calculateOverall(scores),
      };
    } catch (error) {
      logger.error(`Error evaluating article ${article.title}:`, error);
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
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: 'user', content: this.createSummarizationPrompt(article) }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const summary = JSON.parse(content);

      if (!['beginner', 'advanced', 'expert'].includes(summary.level)) {
        summary.level = 'advanced';
      }

      return summary;
    } catch (error) {
      logger.error(`Error summarizing article ${article.title}:`, error);
      return {
        whyItMatters: `Article about ${article.title}`,
        oneSentenceSummary: article.description || article.title,
        keyPoints: [article.description || 'See original article'],
        tags: [article.category as string],
        level: 'advanced' as const,
      };
    }
  }
}

// Factory function
export function createAIService(config: AIConfig): AIService {
  logger.info(`Creating AI service: ${config.provider} with model ${config.model}`);

  switch (config.provider) {
    case 'anthropic':
      return new AnthropicService(config);
    case 'openai':
    case 'openrouter':
    case 'deepseek':
    case 'custom':
      return new OpenAICompatibleService(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
