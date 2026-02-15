/**
 * RSS 源有效性测试脚本
 * 测试待添加的 RSS 源是否可以正常访问和解析
 */

import Parser from 'rss-parser';
import axios from 'axios';

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'InfoHound-RSS-Test/1.0',
  },
});

interface TestSource {
  id: string;
  name: string;
  url: string;
  category: string;
  weight: number;
}

// 待测试的新 RSS 源
const testSources: TestSource[] = [
  {
    id: 'bytebytego',
    name: 'ByteByteGo',
    url: 'https://blog.bytebytego.com/feed',
    category: 'tech-deep',
    weight: 1.3,
  },
  {
    id: 'import-ai',
    name: 'Import AI',
    url: 'https://importai.substack.com/feed',
    category: 'ai',
    weight: 1.3,
  },
  {
    id: 'engineers-codex',
    name: "Engineer's Codex",
    url: 'https://read.engineerscodex.com/feed',
    category: 'tech-deep',
    weight: 1.2,
  },
  {
    id: 'meituan-tech',
    name: '美团技术团队',
    url: 'https://tech.meituan.com/feed/',
    category: 'chinese',
    weight: 1.2,
  },
  {
    id: 'alpha-signal',
    name: 'Alpha Signal',
    url: 'https://alphasignal.ai/feed',
    category: 'ai',
    weight: 1.2,
  },
  {
    id: 'ai-breakfast',
    name: 'AI Breakfast',
    url: 'https://aibreakfast.beehiiv.com/feed',
    category: 'ai',
    weight: 1.0,
  },
  {
    id: 'martin-fowler',
    name: 'Martin Fowler',
    url: 'https://martinfowler.com/feed.atom',
    category: 'tech-deep',
    weight: 1.2,
  },
  {
    id: 'zhangxinxu',
    name: '张鑫旭',
    url: 'https://www.zhangxinxu.com/wordpress/feed/',
    category: 'chinese',
    weight: 1.1,
  },
];

interface TestResult {
  id: string;
  name: string;
  url: string;
  status: 'success' | 'failed' | 'warning';
  message: string;
  articleCount?: number;
  sampleTitles?: string[];
  error?: string;
}

async function testRSSSource(source: TestSource): Promise<TestResult> {
  console.log(`\n🔄 测试: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  try {
    const feed = await rssParser.parseURL(source.url);

    if (!feed.items || feed.items.length === 0) {
      return {
        id: source.id,
        name: source.name,
        url: source.url,
        status: 'warning',
        message: 'RSS 可访问，但没有文章',
        articleCount: 0,
      };
    }

    const recentItems = feed.items
      .filter(item => {
        if (!item.pubDate) return false;
        const pubDate = new Date(item.pubDate);
        const daysAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30; // 只统计最近30天的文章
      })
      .slice(0, 3);

    const sampleTitles = recentItems
      .map(item => item.title)
      .filter(Boolean) as string[];

    return {
      id: source.id,
      name: source.name,
      url: source.url,
      status: 'success',
      message: `✅ 成功获取 ${feed.items.length} 篇文章`,
      articleCount: feed.items.length,
      sampleTitles,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 尝试用 axios 检查 URL 是否可访问
    try {
      const response = await axios.head(source.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'InfoHound-RSS-Test/1.0',
        },
      });

      return {
        id: source.id,
        name: source.name,
        url: source.url,
        status: 'warning',
        message: '⚠️ URL 可访问，但 RSS 解析失败',
        error: errorMessage,
      };
    } catch {
      return {
        id: source.id,
        name: source.name,
        url: source.url,
        status: 'failed',
        message: '❌ 无法访问 RSS 源',
        error: errorMessage,
      };
    }
  }
}

async function main() {
  console.log('==============================================');
  console.log('    InfoHound RSS 源有效性测试');
  console.log('==============================================');
  console.log(`\n待测试源数量: ${testSources.length}`);
  console.log('开始测试...\n');

  const results: TestResult[] = [];

  for (const source of testSources) {
    const result = await testRSSSource(source);
    results.push(result);

    // 延迟 1 秒，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 打印结果汇总
  console.log('\n\n==============================================');
  console.log('              测试结果汇总');
  console.log('==============================================');

  const successResults = results.filter(r => r.status === 'success');
  const warningResults = results.filter(r => r.status === 'warning');
  const failedResults = results.filter(r => r.status === 'failed');

  console.log(`\n✅ 成功: ${successResults.length}`);
  successResults.forEach(r => {
    console.log(`   • ${r.name}: ${r.message}`);
    if (r.sampleTitles && r.sampleTitles.length > 0) {
      console.log(`     最新文章: "${r.sampleTitles[0]}"`);
    }
  });

  if (warningResults.length > 0) {
    console.log(`\n⚠️ 警告: ${warningResults.length}`);
    warningResults.forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
      if (r.error) console.log(`     错误: ${r.error}`);
    });
  }

  if (failedResults.length > 0) {
    console.log(`\n❌ 失败: ${failedResults.length}`);
    failedResults.forEach(r => {
      console.log(`   • ${r.name}: ${r.message}`);
      if (r.error) console.log(`     错误: ${r.error}`);
    });
  }

  // 生成可用于 sources.json 的配置
  console.log('\n\n==============================================');
  console.log('      推荐的 sources.json 配置');
  console.log('==============================================');

  const validSources = successResults.map(r => {
    const source = testSources.find(s => s.id === r.id)!;
    return {
      id: source.id,
      name: source.name,
      type: 'rss',
      url: source.url,
      category: source.category,
      weight: source.weight,
      maxPerDay: source.category === 'chinese' ? 3 : 2,
    };
  });

  if (validSources.length > 0) {
    console.log('\n' + JSON.stringify(validSources, null, 2));
  }

  // 保存详细结果到文件
  const fs = await import('fs-extra');
  const outputPath = './tmp/rss-test-results.json';
  await fs.ensureDir('./tmp');
  await fs.writeJson(outputPath, results, { spaces: 2 });

  console.log(`\n\n详细结果已保存: ${outputPath}`);
  console.log('\n测试完成!');

  // 返回退出码
  process.exit(failedResults.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('测试脚本出错:', error);
  process.exit(1);
});
