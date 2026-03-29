export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 9) +
    "-" +
    Math.random().toString(36).substring(2, 9)
  );
}

export const nicheEmojis: { [key: string]: string } = {
  Pet: "🐾",
  Health: "💪",
  Beauty: "✨",
  Babies: "👶",
  "Tech Gadgets": "📱",
};