/**
 * Hero avatars (roadmap H.2). Emoji on a coloured medallion: no photos, no
 * uploads, nothing that identifies the student. Keys are stored in
 * story_hero_profiles.avatar (checked by the migration).
 */
export const STORY_AVATARS = [
  { key: "renard", emoji: "🦊", label: "Renard rusé" },
  { key: "chouette", emoji: "🦉", label: "Chouette savante" },
  { key: "dragon", emoji: "🐉", label: "Petit dragon" },
  { key: "loup", emoji: "🐺", label: "Loup solitaire" },
  { key: "chat", emoji: "🐱", label: "Chat curieux" },
  { key: "robot", emoji: "🤖", label: "Robot inventeur" },
  { key: "fusee", emoji: "🚀", label: "Pilote de fusée" },
  { key: "boussole", emoji: "🧭", label: "Explorateur" },
  { key: "plume", emoji: "🪶", label: "Plume d’écrivain" },
  { key: "etoile", emoji: "🌟", label: "Étoile filante" },
  { key: "ballon", emoji: "⚽", label: "Champion" },
  { key: "manette", emoji: "🎮", label: "Joueur" },
] as const;

export type StoryAvatarKey = (typeof STORY_AVATARS)[number]["key"];
export const STORY_AVATAR_KEYS = STORY_AVATARS.map((avatar) => avatar.key) as [StoryAvatarKey, ...StoryAvatarKey[]];
export const DEFAULT_AVATAR: StoryAvatarKey = "plume";

export function avatarFor(key: string | null | undefined) {
  return STORY_AVATARS.find((avatar) => avatar.key === key) ?? STORY_AVATARS.find((avatar) => avatar.key === DEFAULT_AVATAR)!;
}
