import type { MetadataRoute } from "next";
import {
  allPagePaths,
  categories,
  courseCategories,
  courses,
  COURSES_PER_PAGE,
  pageNumbers,
  posts,
  POSTS_PER_PAGE,
} from "@/lib/content";
import { abs } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, priority: number, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: abs(path),
    priority,
    ...(lastModified ? { lastModified } : {}),
  });
  return [
    entry("/", 1),
    ...allPagePaths().map((p) => entry(p, 0.8)),
    entry("/technology-business-solutions/", 0.8),
    entry("/blog/", 0.7),
    ...pageNumbers(posts.length, POSTS_PER_PAGE).map((n) => entry(`/blog/page/${n}/`, 0.3)),
    ...categories.map((c) => entry(`/category/${c.slug}/`, 0.4)),
    ...posts.map((p) => entry(p.path, 0.6, p.date)),
    entry("/shop/", 0.8),
    ...pageNumbers(courses.length, COURSES_PER_PAGE).map((n) => entry(`/shop/page/${n}/`, 0.3)),
    ...courseCategories.map((c) => entry(`/product-category/${c.slug}/`, 0.4)),
    ...courses.map((c) => entry(c.path, 0.5)),
  ];
}
