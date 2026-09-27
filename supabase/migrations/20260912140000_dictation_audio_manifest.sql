-- Nullable for historical audio: absence is not certified provenance.
alter table public.dictations add column if not exists audio_manifest jsonb;
comment on column public.dictations.audio_manifest is
  'Server renderer record binding immutable audio bytes to source text and speech input. NULL preserves legacy playback without an exposure-history certification.';
