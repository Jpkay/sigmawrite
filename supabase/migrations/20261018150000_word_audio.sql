-- Word audio for "hear and type" (roadmap 2026-10 D.3). One cached TTS file
-- per lemma ("intrépide. Le pompier intrépide entre dans la maison.
-- intrépide."), rendered by the dictation-audio job into the private
-- dictation-audio bucket (content-addressed immutable path). Students never
-- read this table: the server signs short-lived URLs. Without a ready row the
-- session falls back to "type it from its definition" (fails closed).
create table if not exists public.lexical_word_audio (
  lemma_id uuid primary key references public.lexical_lemmas(id) on delete cascade,
  spoken_text text not null check (length(spoken_text) between 1 and 400),
  status text not null default 'pending' check (status in ('pending','rendering','ready','failed')),
  audio_path text,
  byte_checksum text check (byte_checksum is null or byte_checksum ~ '^sha256:[a-f0-9]{64}$'),
  byte_length integer check (byte_length is null or byte_length > 0),
  mime_type text check (mime_type is null or mime_type in ('audio/mpeg','audio/wav','audio/mp4','audio/ogg')),
  provider text,
  model text,
  voice text,
  error text,
  attempts integer not null default 0 check (attempts >= 0),
  rendered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lexical_word_audio_ready_complete check (
    status <> 'ready' or (audio_path is not null and byte_checksum is not null and mime_type is not null and rendered_at is not null)
  )
);
create index if not exists lexical_word_audio_pending on public.lexical_word_audio(status, updated_at) where status in ('pending','failed');

alter table public.lexical_word_audio enable row level security;
drop policy if exists lexical_word_audio_staff_read on public.lexical_word_audio;
create policy lexical_word_audio_staff_read on public.lexical_word_audio for select using (public.is_staff());
revoke all on public.lexical_word_audio from anon;
revoke insert, update, delete on public.lexical_word_audio from authenticated;
grant select on public.lexical_word_audio to authenticated;

comment on table public.lexical_word_audio is
  'Cached TTS per lemma for word reviews (hear and type). Written by the service role only; signed URLs are issued per session.';
