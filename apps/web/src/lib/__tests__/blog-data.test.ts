import { describe, expect, it } from "vitest";

import {
  getBlogPostBySlug,
  getBlogPosts,
  getBlogPostsByCategory,
} from "../blog-data";

describe("blog-data", () => {
  it("parses checked-in Markdown frontmatter and body content", () => {
    const post = getBlogPostBySlug("google-ads-access-agency");

    expect(post).toMatchObject({
      slug: "google-ads-access-agency",
      title: "Google Ads Access Guide: How Clients Grant Agency Permissions (2026)",
      category: "tutorials",
      stage: "consideration",
      author: {
        name: "Jon High",
        role: "Founder",
      },
    });
    expect(post?.content).toContain("Google's Unique Multi-Product Challenge");
    expect(post?.tags.length).toBeGreaterThan(0);
  });

  it("sorts posts newest first and filters by category", () => {
    const posts = getBlogPosts();
    const securityPosts = getBlogPostsByCategory("security");

    expect(posts.length).toBeGreaterThan(0);
    expect(new Date(posts[0].publishedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(posts[1].publishedAt).getTime()
    );
    expect(securityPosts.length).toBeGreaterThan(0);
    expect(securityPosts.every((post) => post.category === "security")).toBe(
      true
    );
  });
});
