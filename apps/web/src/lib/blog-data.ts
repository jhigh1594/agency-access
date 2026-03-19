/**
 * Blog posts data
 * Content loaded from Markdown files in content/blog/
 * One file per post: {slug}.md with YAML frontmatter + body
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BlogPost, BlogCategory, BlogStage } from "./blog-types";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

const VALID_CATEGORIES: BlogCategory[] = [
  "onboarding",
  "tutorials",
  "comparisons",
  "security",
  "operations",
  "case-studies",
  "research",
];

const VALID_STAGES: BlogStage[] = [
  "awareness",
  "consideration",
  "decision",
];

function parseFileToPost(filePath: string, slug: string): BlogPost {
  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const category = data.category as string;
  const stage = data.stage as string;

  if (!VALID_CATEGORIES.includes(category as BlogCategory)) {
    console.warn(
      `[blog-data] Invalid category "${category}" in ${slug}.md, defaulting to "tutorials"`
    );
  }
  if (!VALID_STAGES.includes(stage as BlogStage)) {
    console.warn(
      `[blog-data] Invalid stage "${stage}" in ${slug}.md, defaulting to "consideration"`
    );
  }

  const author = data.author;
  const authorObj =
    typeof author === "object" && author !== null && "name" in author
      ? {
          name: String(author.name ?? ""),
          role: String(author.role ?? ""),
          avatar: author.avatar ? String(author.avatar) : undefined,
        }
      : { name: "AuthHub Team", role: "Agency Operations Experts" };

  return {
    id: String(data.id ?? slug),
    slug,
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: content.trim(),
    category: (VALID_CATEGORIES.includes(category as BlogCategory)
      ? category
      : "tutorials") as BlogCategory,
    stage: (VALID_STAGES.includes(stage as BlogStage)
      ? stage
      : "consideration") as BlogStage,
    publishedAt: String(data.publishedAt ?? ""),
    readTime: Number(data.readTime) || 5,
    author: authorObj,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    metaTitle: data.metaTitle ? String(data.metaTitle) : undefined,
    metaDescription: data.metaDescription
      ? String(data.metaDescription)
      : undefined,
    relatedPosts: Array.isArray(data.relatedPosts)
      ? data.relatedPosts.map(String)
      : undefined,
    featuredImage: data.featuredImage ? String(data.featuredImage) : undefined,
    canonical: data.canonical ? String(data.canonical) : undefined,
  };
}

function getSlugs(): string[] {
  if (!existsSync(CONTENT_DIR)) {
    return [];
  }
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function loadPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!existsSync(filePath)) {
    return undefined;
  }
  return parseFileToPost(filePath, slug);
}

export function getBlogPosts(): BlogPost[] {
  const slugs = getSlugs();
  const posts = slugs
    .map((slug) => loadPostBySlug(slug))
    .filter((p): p is BlogPost => p !== undefined);
  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return loadPostBySlug(slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return getBlogPosts().filter((post) => post.category === category);
}

export function getRelatedPosts(
  currentPostId: string,
  limit = 3
): BlogPost[] {
  const all = getBlogPosts();
  const current = all.find((p) => p.id === currentPostId);
  if (!current?.relatedPosts?.length) {
    return [];
  }
  const idToPost = new Map(all.map((p) => [p.id, p]));
  return current.relatedPosts
    .map((id) => idToPost.get(id))
    .filter((p): p is BlogPost => p !== undefined)
    .slice(0, limit);
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  return getBlogPosts()
    .filter((post) => post.tags.includes("featured"))
    .slice(0, limit);
}
