CREATE TABLE IF NOT EXISTS "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"level" "cefr_level" NOT NULL,
	"topic" text NOT NULL,
	"text" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
