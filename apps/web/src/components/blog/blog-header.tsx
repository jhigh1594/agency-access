'use client';

/**
 * Blog header component with title, description, and category filters
 * Follows brutalist design system
 */

import { BLOG_CATEGORIES, BlogCategory } from "@/lib/blog-types";
import { m } from "framer-motion";

interface BlogHeaderProps {
  title?: string;
  description?: string;
  selectedCategory?: BlogCategory | "all";
  onCategoryChange?: (category: BlogCategory | "all") => void;
}

export function BlogHeader({
  title = "Agency Growth Resources",
  description = "Expert guides, tutorials, and strategies for marketing agencies",
  selectedCategory = "all",
  onCategoryChange,
}: BlogHeaderProps) {
  const categories = [
    { id: "all" as const, name: "All Posts", icon: "📚" },
    ...Object.values(BLOG_CATEGORIES),
  ];

  return (
    <section className="border-b-2 border-black bg-paper">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Title and description */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h1 className="font-dela text-4xl sm:text-5xl md:text-6xl text-ink mb-4 tracking-tight">
            {title}
          </h1>
          <p className="font-mono text-lg text-gray-600">{description}</p>
        </m.div>

        {/* Category filters */}
        {onCategoryChange && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`
                    px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 rounded-none
                    transition-all
                    ${
                      isSelected
                        ? "bg-ink text-white border-black shadow-brutalist-sm"
                        : "bg-card text-ink border-black hover:bg-gray-100 hover:translate-x-[2px] hover:translate-y-[2px]"
                    }
                  `}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </button>
              );
            })}
          </m.div>
        )}
      </div>
    </section>
  );
}
