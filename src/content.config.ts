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
});

export const collections = {
  news: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/news' }), schema: post }),
  articles: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/articles' }), schema: post }),
};
