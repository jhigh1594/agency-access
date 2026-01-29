'use client';

/**
 * Blog content renderer for displaying blog post content
 * Converts markdown-style content to HTML with brutalist styling
 */

import { BlogPost, BLOG_CATEGORIES } from "@/lib/blog-types";
import { Calendar, Clock, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogContentProps {
  post: BlogPost;
}

export function BlogContent({ post }: BlogContentProps) {
  const category = BLOG_CATEGORIES[post.category];

  // Simple markdown-like parser (in production, use a proper markdown library)
  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1
            key={index}
            className="font-dela text-4xl md:text-5xl text-ink mt-12 mb-6"
          >
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="font-dela text-2xl md:text-3xl text-ink mt-10 mb-4 border-b-2 border-black pb-2"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3
            key={index}
            className="font-dela text-xl md:text-2xl text-ink mt-8 mb-3"
          >
            {line.replace("### ", "")}
          </h3>
        );
      }

      // Lists
      if (line.match(/^\d+\./)) {
        return (
          <li key={index} className="ml-6 mb-2 font-mono text-ink">
            {line.replace(/^\d+\.\s*/, "")}
          </li>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="ml-6 mb-2 font-mono text-ink">
            {line.replace(/^[-*]\s*/, "")}
          </li>
        );
      }

      // Bold text
      if (line.includes("**")) {
        const parts = line.split(/\*\*/g);
        return (
          <p key={index} className="mb-4 font-mono text-ink leading-relaxed">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-bold text-ink">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }

      // Code blocks
      if (line.startsWith("```")) {
        return null; // Skip code block delimiters
      }
      if (line.startsWith("|")) {
        return (
          <div key={index} className="overflow-x-auto my-6 border-2 border-black">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-black bg-gray-100">
                  {line.split("|").filter(Boolean).map((cell, i) => (
                    <td
                      key={i}
                      className="px-4 py-2 font-bold text-left border-r border-black last:border-r-0"
                    >
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      // Horizontal rule
      if (line.match(/^---+$/)) {
        return (
          <hr
            key={index}
            className="my-8 border-2 border-black border-dashed"
          />
        );
      }

      // Blockquote
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={index}
            className="border-l-4 border-coral pl-4 my-4 italic text-gray-700"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={index} className="h-4" />;
      }

      // Regular paragraph
      if (line.trim()) {
        return (
          <p key={index} className="mb-4 font-mono text-ink leading-relaxed">
            {line}
          </p>
        );
      }

      return null;
    });
  };

  return (
    <article className="max-w-4xl mx-auto">
      {/* Article header */}
      <header className="mb-10 pb-10 border-b-2 border-black">
        {/* Category badge */}
        <span
          className={`inline-block px-3 py-1 text-sm font-bold uppercase tracking-wider bg-${category.color} text-white border-2 border-black mb-4`}
        >
          {category.icon} {category.name}
        </span>

        {/* Title */}
        <h1 className="font-dela text-3xl sm:text-4xl md:text-5xl text-ink mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="font-mono text-lg text-gray-600 mb-6">{post.excerpt}</p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-gray-600">
          <span className="flex items-center gap-2">
            <User size={16} />
            <span className="font-bold">{post.author.name}</span>
            <span className="text-gray-400">· {post.author.role}</span>
          </span>
          <span className="flex items-center gap-2">
            <Calendar size={16} />
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={16} />
            {post.readTime} min read
          </span>
          <Button
            variant="brutalist-ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  text: post.excerpt,
                  url: `/blog/${post.slug}`,
                });
              }
            }}
          >
            <Share2 size={14} className="mr-1" />
            Share
          </Button>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-mono bg-gray-100 border-2 border-gray-300 rounded-none hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        {renderContent(post.content)}
      </div>

      {/* Article footer */}
      <footer className="mt-16 pt-8 border-t-2 border-black">
        <div className="bg-coral/10 border-2 border-coral p-6 rounded-none">
          <h3 className="font-dela text-xl text-ink mb-2">
            Ready to transform your client onboarding?
          </h3>
          <p className="font-mono text-gray-700 mb-4">
            Join 50+ agencies saving hundreds of hours every month with Agency
            Access Platform.
          </p>
          <Button variant="brutalist" size="lg">
            Start Your Free Trial
          </Button>
        </div>
      </footer>
    </article>
  );
}


