import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

// Decap CMS peut sérialiser un champ optionnel laissé vide en chaîne vide.
// On la traite comme une absence : pas d'échec de build sur une URL vide, et
// les valeurs de repli (texte alternatif, légende) restent utilisables.
const optionalText = () =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  );

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
      cover: optionalText(),
      // Texte alternatif de la couverture : recommandé pour l'accessibilité,
      // mais optionnel pour ne pas invalider les articles déjà publiés.
      coverAlt: optionalText(),
      // Légende visible sous la couverture (facultative).
      coverCaption: optionalText(),
      draft: z.boolean().default(false),
    })
    .strict(),
});

// Galerie de GIF : contenu éditorial réservé à l'administration Decap.
// Chaque entrée pointe soit vers un fichier uploadé (`image`, médiathèque),
// soit vers une URL externe https (`externalUrl`) ; au moins l'un des deux.
const gallery = defineCollection({
  type: 'content',
  schema: z
    .object({
      title: z.string().min(2),
      date: z.coerce.date(),
      image: optionalText(),
      externalUrl: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z
          .string()
          .url()
          .refine((value) => value.startsWith('https://'), {
            message: 'L’URL externe doit commencer par https://',
          })
          .optional(),
      ),
      // Obligatoire : un GIF sans alternative textuelle n'est pas publiable.
      alt: z.string().min(3),
      description: optionalText(),
      credit: optionalText(),
      tags: z.array(z.string()).default([]),
    })
    .strict()
    .refine((data) => Boolean(data.image || data.externalUrl), {
      message: 'Indiquez une image locale ou une URL externe (au moins l’un des deux).',
      path: ['image'],
    }),
});

export const collections = { blog, gallery };
