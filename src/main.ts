import * as fs from 'fs-extra';
import * as path from 'path';
import pLimit from 'p-limit';

import { loadConfig, getAIConfig, logger } from './utils';
import { createCollector } from './collectors';
import { createAIService, AIService } from './ai';
import { Orchestrator } from './orchestrator';
import { NewsletterRenderer } from './renderer';
import { RawArticle, ArticleWithScore, ArticleWithSummary } from './types';

async function fetchArticles(): Promise<RawArticle[]> {
  const { sources } = await loadConfig();
  const articles: RawArticle[] = [];

  for (const sourceConfig of sources) {
    try {
      const collector = createCollector(sourceConfig);
      const sourceArticles = await collector.fetch();
      articles.push(...sourceArticles);
      logger.info(`Collected ${sourceArticles.length} articles from ${sourceConfig.name}`);
    } catch (error) {
      logger.error(`Failed to fetch from ${sourceConfig.name}:`, error);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = articles.filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  logger.info(`Total unique articles: ${unique.length}`);
  return unique;
}

async function evaluateArticles(
  articles: RawArticle[],
  aiService: AIService
): Promise<ArticleWithScore[]> {
  const limit = pLimit(3); // Limit concurrent AI calls

  const evaluated = await Promise.all(
    articles.map(article =>
      limit(async () => {
        try {
          const scores = await aiService.evaluate(article);
          return {
            ...article,
            scores,
            overallScore: scores.overall,
          };
        } catch (error) {
          logger.error(`Failed to evaluate ${article.title}:`, error);
          return {
            ...article,
            scores: {
              novelty: 5,
              depth: 5,
              practicality: 5,
              relevance: 5,
              overall: 5,
            },
            overallScore: 5,
          };
        }
      })
    )
  );

  // Filter for quality (score >= 7)
  const quality = evaluated.filter(a => a.overallScore >= 7);
  logger.info(`Articles passing quality threshold (>=7): ${quality.length}`);

  return quality;
}

async function summarizeArticles(
  articles: ArticleWithScore[],
  aiService: AIService
): Promise<ArticleWithSummary[]> {
  const limit = pLimit(3);

  const summarized = await Promise.all(
    articles.map(article =>
      limit(async () => {
        try {
          const summary = await aiService.summarize(article);
          return {
            ...article,
            summary,
          };
        } catch (error) {
          logger.error(`Failed to summarize ${article.title}:`, error);
          return {
            ...article,
            summary: {
              whyItMatters: `Article about ${article.title}`,
              oneSentenceSummary: article.description || article.title,
              keyPoints: [article.description || 'See original article'],
              tags: [article.category as string],
              level: 'advanced' as const,
            },
          };
        }
      })
    )
  );

  return summarized;
}

async function generateDigest() {
  try {
    logger.info('Starting InfoHound digest generation...');

    // Initialize services
    const aiConfig = getAIConfig();
    const aiService = createAIService(aiConfig);
    const orchestrator = new Orchestrator();
    const renderer = new NewsletterRenderer();

    // Step 1: Fetch articles
    logger.info('Step 1: Fetching articles...');
    const rawArticles = await fetchArticles();

    if (rawArticles.length === 0) {
      logger.warn('No articles found');
      return;
    }

    // Step 2: Evaluate quality
    logger.info('Step 2: Evaluating article quality...');
    const evaluated = await evaluateArticles(rawArticles.slice(0, 20), aiService);

    if (evaluated.length === 0) {
      logger.warn('No articles passed quality threshold');
      return;
    }

    // Step 3: Generate summaries
    logger.info('Step 3: Generating summaries...');
    const summarized = await summarizeArticles(evaluated.slice(0, 15), aiService);

    // Step 4: Orchestrate into digest
    logger.info('Step 4: Orchestrating digest...');
    const digest = orchestrator.orchestrate(summarized);

    // Step 5: Render outputs
    logger.info('Step 5: Rendering outputs...');
    const markdown = renderer.render(digest);
    const html = renderer.renderHTML(digest);

    // Step 6: Save outputs
    const date = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'dist');
    await fs.ensureDir(outputDir);

    // Save Markdown
    const mdPath = path.join(outputDir, `${date}.md`);
    await fs.writeFile(mdPath, markdown);
    logger.info(`Saved Markdown: ${mdPath}`);

    // Save HTML
    const htmlPath = path.join(outputDir, 'index.html');
    await fs.writeFile(htmlPath, html);
    logger.info(`Saved HTML: ${htmlPath}`);

    // Save to archive
    const archiveDir = path.join(process.cwd(), 'data', 'archive');
    await fs.ensureDir(archiveDir);
    const archivePath = path.join(archiveDir, `${date}.md`);
    await fs.writeFile(archivePath, markdown);

    logger.info('InfoHound digest generation completed!');

  } catch (error) {
    logger.error('Fatal error during digest generation:', error);
    process.exit(1);
  }
}

// CLI
const command = process.argv[2];

if (command === 'fetch' || command === 'generate' || !command) {
  generateDigest();
} else {
  console.log('Usage: npm run fetch | npm run generate');
  process.exit(0);
}
