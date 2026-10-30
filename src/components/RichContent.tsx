/**
 * Renders migrated content. The HTML is produced by scripts/migrate.py from the recovered pages with an
 * allow-list serializer (no scripts, styles, event handlers or attributes beyond href/src/alt/size), so it is
 * trusted, build-time content.
 */
export default function RichContent({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
