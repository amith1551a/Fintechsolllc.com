import Link from "next/link";
import { plain, type Course } from "@/lib/content";
import MediaImage from "./MediaImage";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-lg">
      <Link href={course.path} tabIndex={-1} aria-hidden="true">
        <MediaImage image={course.image} label={course.title} className="aspect-[4/3]" fit="contain" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {course.categories[0] && (
          <Link href={`/product-category/${course.categories[0].slug}/`} className="text-xs font-semibold uppercase tracking-wider text-brand-600 hover:text-navy">
            {course.categories[0].name}
          </Link>
        )}
        <h3 className="mt-2 font-semibold leading-snug text-navy">
          <Link href={course.path} className="hover:text-brand-600">
            {course.title}
          </Link>
        </h3>
        {course.shortDescription && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{plain(course.shortDescription)}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {course.price && <p className="text-sm font-semibold text-navy">{course.price}</p>}
          <Link href={course.path} className="shrink-0 text-sm font-semibold text-brand-600 hover:text-navy">
            Details<span className="sr-only">: {course.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
