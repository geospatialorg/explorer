CREATE TABLE IF NOT EXISTS "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tags" text[] DEFAULT '{}'::text[],
	"thumbnail_path" text,
	"type" text,
	"item_type" text,
	"author" text,
	"institution" text,
	"license" text,
	"language" text,
	"year_start" integer,
	"year_end" integer,
	"bbox_west" real,
	"bbox_south" real,
	"bbox_east" real,
	"bbox_north" real,
	"external_links" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"item_type" text DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"year_start" integer,
	"year_end" integer,
	"language" text,
	"description" text,
	"notes" text,
	"keywords" text[] DEFAULT '{}'::text[],
	"georef_status" text DEFAULT 'none' NOT NULL,
	"scale" text,
	"projection_crs" text,
	"bbox_west" real,
	"bbox_south" real,
	"bbox_east" real,
	"bbox_north" real,
	"display_order" integer,
	"image_size_x" integer,
	"image_size_y" integer,
	"has_vector_derivative" boolean DEFAULT false,
	"author" text,
	"institution" text,
	"license" text,
	"extra_metadata" jsonb,
	"validation_status" text DEFAULT 'draft' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"role" text DEFAULT 'view' NOT NULL,
	"url" text NOT NULL,
	"protocol" text,
	"format" text,
	"mime_type" text,
	"layer_name" text,
	"file_size_bytes" integer,
	"description" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slug_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"old_slug" text NOT NULL,
	"new_slug" text NOT NULL,
	"entity_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slug_redirects_old_slug_unique" UNIQUE("old_slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collections_search_idx" ON "collections" USING gin (to_tsvector('romanian', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("author", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_collection_idx" ON "items" USING btree ("collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "items_slug_idx" ON "items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_georef_idx" ON "items" USING btree ("georef_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_year_idx" ON "items" USING btree ("year_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_published_idx" ON "items" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_search_idx" ON "items" USING gin (to_tsvector('romanian', coalesce("title", '') || ' ' || coalesce("subtitle", '') || ' ' || coalesce("description", '') || ' ' || coalesce("notes", '')));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_item_idx" ON "resources" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_type_idx" ON "resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_role_idx" ON "resources" USING btree ("role");