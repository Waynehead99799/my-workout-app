const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;

export function extractYoutubeUrl(text?: string | null) {
  if (!text) {
    return null;
  }

  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : null;
}

export function extractYoutubeId(input?: string | null) {
  if (!input) {
    return null;
  }

  const matched = input.match(YOUTUBE_REGEX);
  return matched?.[1] ?? null;
}

export function cleanLabelWithoutUrl(text?: string | null) {
  if (!text) {
    return "";
  }

  return text.replace(/https?:\/\/[^\s)]+/gi, "").trim();
}
