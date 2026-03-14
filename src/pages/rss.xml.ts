import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: any) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  return rss({
    title: 'Terma Foundry Blog',
    description: 'Articles on Tibetan typography, pecha manuscripts, CSS frameworks, fonts, and digital tools for preserving the Tibetan script.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishDate,
      description: post.data.snippet,
      link: `/blog/${post.slug}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
