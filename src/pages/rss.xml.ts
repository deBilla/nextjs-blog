import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, metaDescription } from "../utils/posts";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  const site = (context.site ?? new URL(SITE.url)).href.replace(/\/$/, "");

  return rss({
    title: `${SITE.author} — Writing`,
    description: SITE.description,
    site,
    trailingSlash: false,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      dc: "http://purl.org/dc/elements/1.1/",
    },
    items: posts.map((post) => ({
      title: post.data.title,
      description: metaDescription(post),
      pubDate: post.data.date,
      link: `/blogs/${post.id}`,
      categories: post.data.tags,
      // `<author>` must be an email address per the RSS spec, so the byline
      // goes in Dublin Core's `dc:creator`, which readers understand.
      customData: `<dc:creator>${SITE.author}</dc:creator>`,
    })),
    customData: [
      `<language>en-gb</language>`,
      `<atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>`,
      `<copyright>© ${new Date().getFullYear()} ${SITE.author}</copyright>`,
    ].join(""),
  });
}
