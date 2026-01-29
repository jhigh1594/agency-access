/**
 * Individual blog post page
 */

import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog-data";
import { BLOG_CATEGORIES } from "@/lib/blog-types";
import { BlogContent } from "@/components/blog/blog-content";
import { BlogNavigation } from "@/components/blog/blog-navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { getRelatedPosts } from "@/lib/blog-data";
import { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Get previous and next posts for navigation
  const allPosts = getBlogPosts();
  const currentIndex = allPosts.findIndex((p) => p.id === post.id);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : undefined;
  const nextPost =
    currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : undefined;

  // Get related posts
  const relatedPosts = getRelatedPosts(post.id, 3);

  return (
    <div className="min-h-screen bg-paper">
      {/* Article container */}
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BlogContent post={post} />
      </article>

      {/* Navigation */}
      <BlogNavigation previousPost={previousPost} nextPost={nextPost} />

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-dela text-2xl text-ink mb-6 border-l-4 border-teal pl-4">
            Related Articles
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {/* CTA section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border-[3px] border-black bg-ink text-white p-8 md:p-12 rounded-none text-center">
          <h2 className="font-dela text-3xl md:text-4xl mb-4">
            Ready to Transform Your Client Onboarding?
          </h2>
          <p className="font-mono text-gray-300 mb-6 max-w-xl mx-auto">
            Join 50+ agencies saving hundreds of hours every month. Replace
            47-email onboarding with a single link.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="px-8 py-4 bg-coral text-white font-bold uppercase tracking-wider border-2 border-white rounded-none hover:bg-white hover:text-ink transition-all"
            >
              Start Free Trial
            </a>
            <a
              href="#"
              className="px-8 py-4 bg-transparent text-white font-bold uppercase tracking-wider border-2 border-white rounded-none hover:bg-white hover:text-ink transition-all"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Generate static params for all blog posts (for static generation)
export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
