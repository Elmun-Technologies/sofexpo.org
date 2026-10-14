import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const post = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  hero: z.string().optional(),
  event: z.string().optional(),
  readingMinutes: z.number().default(4),
  draft: z.boolean().default(false),
  // posts mirrored from the Telegram channel keep a "Read on Telegram" backlink
  // (written by the tg-blog sync; never edited by hand) — docs/telegram-blog-sync.md
  telegram: z.string().optional(),
});

export const collections = {
  news: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/news' }), schema: post }),
  articles: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/articles' }), schema: post }),
};
