/**
 * schema.org structured data for search engines. Only ever give it our own
 * static or CMS-sourced fields; `<` is escaped so no value can close the tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
