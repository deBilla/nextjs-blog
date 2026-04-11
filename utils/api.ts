import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
import { BlogPostField } from "../types";

const postsDirectory = join(process.cwd(), "_posts");
const blogsDirectory = join(process.cwd(), "_blogs");

// ── Old _posts helpers (kept for compatibility) ──────────────────────────────

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(
  slug: string,
  fields: BlogPostField[] = []
): Record<string, string> {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: Record<string, string> = {};
  fields.forEach((field) => {
    if (field === "slug") items[field] = realSlug;
    if (field === "content") items[field] = content;
    if (typeof data[field] !== "undefined") items[field] = data[field];
  });
  return items;
}

export function getAllPosts(fields: BlogPostField[] = []): Record<string, string>[] {
  const slugs = getPostSlugs();
  return slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

// ── _blogs helpers ───────────────────────────────────────────────────────────

export function getBlogSlugs(): string[] {
  return fs.readdirSync(blogsDirectory);
}

export function getBlogBySlug(
  slug: string,
  fields: string[] = []
): Record<string, string> {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(blogsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: Record<string, string> = {};
  fields.forEach((field) => {
    if (field === "slug") items[field] = realSlug;
    if (field === "content") items[field] = content;
    if (typeof data[field] !== "undefined") items[field] = data[field];
  });
  return items;
}

export function getAllBlogs(fields: string[] = []): Record<string, string>[] {
  const slugs = getBlogSlugs();
  return slugs
    .map((slug) => getBlogBySlug(slug, fields))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}
