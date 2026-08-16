import type { APIRoute, GetStaticPaths } from "astro";
import { formatDate, getPosts, readingTime, type Post } from "../../utils/posts";
import { renderOgImage } from "../../utils/og";

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };

  const png = await renderOgImage({
    title: post.data.title,
    meta: `${formatDate(post.data.date)} · ${readingTime(post)}`,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
