CREATE TABLE IF NOT EXISTS "word_bank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"german" text NOT NULL,
	"translation" text NOT NULL,
	"part_of_speech" text NOT NULL,
	"example_sentence" text,
	"cefr_level" "cefr_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "word_bank_german_unique" UNIQUE("german")
);
