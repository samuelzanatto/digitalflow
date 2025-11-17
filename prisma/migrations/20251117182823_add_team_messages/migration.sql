-- CreateTable
CREATE TABLE "team_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "content" TEXT NOT NULL,
    "inserted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "team_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_messages_user_id_idx" ON "team_messages"("user_id");

-- CreateIndex
CREATE INDEX "team_messages_inserted_at_idx" ON "team_messages"("inserted_at");

-- Relationships
ALTER TABLE "team_messages"
    ADD CONSTRAINT "team_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES auth.users("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Enable Row Level Security and policies mirroring Supabase docs
ALTER TABLE "team_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_messages_select_authenticated"
    ON "team_messages"
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "team_messages_insert_authenticated"
    ON "team_messages"
    FOR INSERT
    WITH CHECK (auth.uid() = "user_id");
