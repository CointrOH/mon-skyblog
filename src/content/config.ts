import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

// API "legacy" (flag `legacy.collectionsBackwardsCompat`) :
// pas de loader, type `content`, schéma Zod appliqué à chaque frontmatter.
const blog = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string().min(3),
      date: z.coerce.date(),
      description: z.string().min(10),
      author: z.string().default('Le Webmaster'),
      tags: z.array(z.string()).default([]),
      cover: z.string().optional(),
      draft: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { blog };
