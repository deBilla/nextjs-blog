import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../utils/posts";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: `${SITE.author} — Writing`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.preview,
      pubDate: post.data.date,
      link: `/blogs/${post.id}`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
