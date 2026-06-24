import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appDir = path.join(process.cwd(), "src", "app");
const blogDir = path.join(process.cwd(), "content", "blog");

const routeFilesByPath = new Map<string, string>([
  ["/about", "(marketing)/about/page.tsx"],
  ["/guides/meta-ads-access", "(marketing)/guides/meta-ads-access/page.tsx"],
  ["/guides/google-ads-access", "(marketing)/guides/google-ads-access/page.tsx"],
  ["/sign-in", "(auth)/sign-in/[[...sign-in]]/page.tsx"],
  ["/sign-up", "(auth)/sign-up/[[...sign-up]]/page.tsx"],
]);

function readBlogMarkdown(): string {
  return readdirSync(blogDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readFileSync(path.join(blogDir, file), "utf8"))
    .join("\n");
}

describe("marketing link integrity", () => {
  it("has route files for crawled public targets", () => {
    for (const [route, file] of routeFilesByPath) {
      expect(existsSync(path.join(appDir, file)), `${route} should render`).toBe(true);
    }
  });

  it("does not publish placeholder document links in blog content", () => {
    expect(readBlogMarkdown()).not.toContain("docs.google.com/document/d/1-placeholder");
  });
});
