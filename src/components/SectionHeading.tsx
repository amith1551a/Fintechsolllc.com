export default function SectionHeading({
  title,
  eyebrow,
  description,
  align = "center",
  as: Tag = "h2",
  tone = "dark",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  align?: "center" | "left";
  as?: "h2" | "h3";
  tone?: "dark" | "light";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${tone === "dark" ? "text-brand-600" : "text-amber"}`}>{eyebrow}</p>
      )}
      <Tag className={`mt-2 text-3xl font-bold leading-tight sm:text-4xl ${tone === "dark" ? "text-navy" : "text-white"}`}>{title}</Tag>
      <span className={`mt-4 block h-1 w-14 rounded-full bg-amber ${align === "center" ? "mx-auto" : ""}`} aria-hidden="true" />
      {description && <p className={`mt-5 text-base leading-7 ${tone === "dark" ? "text-muted" : "text-white/80"}`}>{description}</p>}
    </div>
  );
}
