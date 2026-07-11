import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    tags: text("tags").array().default(sql`'{}'::text[]`),
    thumbnailPath: text("thumbnail_path"),
    type: text("type"),
    itemType: text("item_type"),
    download: jsonb("download").$type<Array<{ format: string; title: string; link: string }>>(),
    interactiveMap: text("interactive_map"),
    author: text("author"),
    institution: text("institution"),
    license: text("license"),
    language: text("language"),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
    bboxWest: real("bbox_west"),
    bboxSouth: real("bbox_south"),
    bboxEast: real("bbox_east"),
    bboxNorth: real("bbox_north"),
    externalLinks: jsonb("external_links").$type<
      Array<{ label: string; url: string }>
    >(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("collections_slug_idx").on(t.slug),
    searchIdx: index("collections_search_idx").using(
      "gin",
      sql`to_tsvector('romanian', coalesce(${t.title}, '') || ' ' || coalesce(${t.description}, '') || ' ' || coalesce(${t.author}, ''))`
    ),
  })
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    itemType: text("item_type").notNull().default("other"),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
    language: text("language"),
    description: text("description"),
    notes: text("notes"),
    keywords: text("keywords").array().default(sql`'{}'::text[]`),
    georefStatus: text("georef_status").notNull().default("none"),
    scale: text("scale"),
    projectionCrs: text("projection_crs"),
    bboxWest: real("bbox_west"),
    bboxSouth: real("bbox_south"),
    bboxEast: real("bbox_east"),
    bboxNorth: real("bbox_north"),
    displayOrder: integer("display_order"),
    imageSizeX: integer("image_size_x"),
    imageSizeY: integer("image_size_y"),
    hasVectorDerivative: boolean("has_vector_derivative").default(false),
    author: text("author"),
    institution: text("institution"),
    license: text("license"),
    extraMetadata: jsonb("extra_metadata"),
    validationStatus: text("validation_status").notNull().default("draft"),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    collectionIdx: index("items_collection_idx").on(t.collectionId),
    slugIdx: uniqueIndex("items_slug_idx").on(t.slug),
    georefIdx: index("items_georef_idx").on(t.georefStatus),
    yearIdx: index("items_year_idx").on(t.yearStart),
    publishedIdx: index("items_published_idx").on(t.isPublished),
    searchIdx: index("items_search_idx").using(
      "gin",
      sql`to_tsvector('romanian', coalesce(${t.title}, '') || ' ' || coalesce(${t.subtitle}, '') || ' ' || coalesce(${t.description}, '') || ' ' || coalesce(${t.notes}, ''))`
    ),
  })
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    resourceType: text("resource_type").notNull(),
    role: text("role").notNull().default("view"),
    url: text("url").notNull(),
    protocol: text("protocol"),
    format: text("format"),
    mimeType: text("mime_type"),
    layerName: text("layer_name"),
    fileSizeBytes: integer("file_size_bytes"),
    description: text("description"),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    itemIdx: index("resources_item_idx").on(t.itemId),
    typeIdx: index("resources_type_idx").on(t.resourceType),
    roleIdx: index("resources_role_idx").on(t.role),
  })
);

export const slugRedirects = pgTable("slug_redirects", {
  id: uuid("id").defaultRandom().primaryKey(),
  oldSlug: text("old_slug").notNull().unique(),
  newSlug: text("new_slug").notNull(),
  entityType: text("entity_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
