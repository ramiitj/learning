import type { CollectionConfig } from "payload";
import { creatorOnly, publishedOrStaff, staffRead, staffWrite } from "../access";
import { auditHooks } from "../events";
import { requireCreatorToPublish } from "../publish";
import { revalidateContent } from "../revalidate";

const LOCALES = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Telugu", value: "te" },
];

const published = (slug: string): Partial<CollectionConfig> => ({
  versions: { drafts: true, maxPerDoc: 100 },
  access: { read: publishedOrStaff(slug), create: staffWrite(slug), update: staffWrite(slug), delete: creatorOnly },
  hooks: {
    beforeChange: [requireCreatorToPublish],
    afterChange: [...auditHooks(slug).afterChange, ({ doc }) => (revalidateContent(), doc)],
    afterDelete: auditHooks(slug).afterDelete,
  },
});

export const Detours: CollectionConfig = {
  slug: "detours",
  admin: { useAsTitle: "detourId", group: "Content" },
  ...published("detours"),
  fields: [
    { name: "detourId", type: "text", required: true, unique: true, index: true },
    { name: "doc", type: "json", required: true, admin: { description: "The detour: titleKey, blocks and strings per locale." } },
  ],
};

export const Glossary: CollectionConfig = {
  slug: "glossary",
  admin: { useAsTitle: "term", defaultColumns: ["term", "termId", "locale", "_status"], group: "Content" },
  ...published("glossary"),
  indexes: [{ fields: ["termId", "locale"], unique: true }],
  fields: [
    { name: "termId", type: "text", required: true, index: true },
    { name: "locale", type: "select", required: true, options: LOCALES },
    { name: "term", type: "text", required: true },
    { name: "definition", type: "textarea", required: true },
  ],
};

export const Analogies: CollectionConfig = {
  slug: "analogies",
  admin: { useAsTitle: "source", defaultColumns: ["concept", "source", "_status"], group: "Content", description: "The shared analogy bank (Article 7)." },
  ...published("analogies"),
  fields: [
    { name: "concept", type: "text", required: true, index: true },
    { name: "source", type: "text", required: true, admin: { description: "The everyday situation." } },
    { name: "mappings", type: "json", required: true, admin: { description: "[{ source, target, relation }]" } },
    { name: "breakPoint", type: "textarea", required: true },
    { name: "fading", type: "json" },
    { name: "localeVariants", type: "json" },
    { name: "subjects", type: "json", admin: { description: "Subjects and concepts this analogy also serves." } },
  ],
};

export const Concepts: CollectionConfig = {
  slug: "concepts",
  admin: { useAsTitle: "name", group: "Content", description: "The concept graph (docs/13)." },
  access: { read: () => true, create: staffWrite("concepts"), update: staffWrite("concepts"), delete: creatorOnly },
  hooks: auditHooks("concepts"),
  fields: [
    { name: "conceptId", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "subject", type: "text", required: true, defaultValue: "ai" },
    { name: "description", type: "textarea" },
    { name: "prerequisites", type: "relationship", relationTo: "concepts", hasMany: true },
    { name: "lessons", type: "json", admin: { description: "Lesson ids that teach this concept." } },
  ],
};

export const TeacherGuides: CollectionConfig = {
  slug: "teacher-guides",
  admin: { useAsTitle: "lessonId", group: "Content" },
  ...published("teacher-guides"),
  access: { read: publishedOrStaff("teacher-guides"), create: staffWrite("teacher-guides"), update: staffWrite("teacher-guides"), delete: creatorOnly },
  fields: [
    { name: "lessonId", type: "text", required: true, index: true },
    { name: "locale", type: "select", required: true, options: LOCALES },
    { name: "guide", type: "json", required: true, admin: { description: "Teacher guide (objectives, timing, misconceptions, no-device path, parent note)." } },
  ],
};

export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "filename", group: "Content", description: "Every asset carries provenance, a licence and captions per locale (docs/08)." },
  upload: { mimeTypes: ["image/*", "video/*", "audio/*", "image/svg+xml"], imageSizes: [{ name: "small", width: 480 }, { name: "medium", width: 960 }] },
  access: { read: () => true, create: staffWrite("media"), update: staffWrite("media"), delete: creatorOnly },
  hooks: auditHooks("media"),
  fields: [
    { name: "alt", type: "json", required: true, admin: { description: "Alt text per locale: { en, hi, te }." } },
    { name: "captions", type: "json", admin: { description: "WebVTT captions per locale, for audio and video." } },
    { name: "transcripts", type: "json", admin: { description: "Transcript per locale." } },
    { name: "provenance", type: "textarea", required: true, admin: { description: "Who made it, how, and from what." } },
    { name: "licence", type: "select", required: true, options: ["own-work", "cc-by", "cc-by-sa", "cc0", "licensed", "public-domain"] },
    { name: "reviewStatus", type: "select", defaultValue: "unreviewed", options: ["unreviewed", "approved", "rejected"], access: { update: ({ req }) => creatorOnly({ req }) as boolean } },
  ],
};

export const Audiences: CollectionConfig = {
  slug: "audiences",
  admin: { useAsTitle: "label", group: "Platform" },
  access: { read: staffRead("audiences"), create: creatorOnly, update: creatorOnly, delete: creatorOnly },
  hooks: auditHooks("audiences"),
  fields: [
    { name: "audienceId", type: "text", required: true, unique: true },
    { name: "label", type: "text", required: true },
    { name: "profile", type: "json", required: true },
  ],
};
