export interface GenreTheme {
  gradient: string;
  emojis: string[];
}

export const genreThemes: Record<string, GenreTheme> = {
  Action: { gradient: "linear-gradient(135deg, #2b1055, #7a0000)", emojis: ["💥", "🔥", "🚗", "🔫"] },
  Adventure: { gradient: "linear-gradient(135deg, #1e5631, #a8c66c)", emojis: ["🗺️", "⛰️", "🧭", "🏕️"] },
  Animation: { gradient: "linear-gradient(135deg, #ff6fd8, #3813c2)", emojis: ["🎨", "🧸", "✨", "🖍️"] },
  Comedy: { gradient: "linear-gradient(135deg, #f7b733, #fc4a1a)", emojis: ["😂", "🎭", "🤣", "🎉"] },
  Crime: { gradient: "linear-gradient(135deg, #0f0f0f, #4b0000)", emojis: ["🕵️", "🔫", "🚔", "💰"] },
  Documentary: { gradient: "linear-gradient(135deg, #3a5f0b, #2c2c2c)", emojis: ["🎥", "📚", "🌍", "🔍"] },
  Drama: { gradient: "linear-gradient(135deg, #485563, #29323c)", emojis: ["🎭", "🎬", "💧", "🕯️"] },
  Family: { gradient: "linear-gradient(135deg, #a8e063, #56ab2f)", emojis: ["👨‍👩‍👧", "🎈", "🧁", "🌈"] },
  Fantasy: { gradient: "linear-gradient(135deg, #16222a, #3a6073)", emojis: ["🧙‍♂️", "🐉", "✨", "🏰"] },
  History: { gradient: "linear-gradient(135deg, #8d6e3f, #3e2b1a)", emojis: ["📜", "⚔️", "🏛️", "👑"] },
  Horror: { gradient: "linear-gradient(135deg, #0d0d0d, #4a0000)", emojis: ["👻", "🔪", "🦇", "💀"] },
  Music: { gradient: "linear-gradient(135deg, #ff0099, #493240)", emojis: ["🎵", "🎸", "🎤", "🎧"] },
  Mystery: { gradient: "linear-gradient(135deg, #1a1a2e, #16213e)", emojis: ["🔍", "🕵️", "🗝️", "🌙"] },
  Romance: { gradient: "linear-gradient(135deg, #ff9a9e, #fecfef)", emojis: ["❤️", "🌹", "💋", "💌"] },
  "Science Fiction": { gradient: "linear-gradient(135deg, #000000, #434343)", emojis: ["🚀", "👽", "🛰️", "🤖"] },
  Thriller: { gradient: "linear-gradient(135deg, #1f1c2c, #928dab)", emojis: ["🔦", "🕵️", "⏱️", "🔪"] },
  War: { gradient: "linear-gradient(135deg, #3c3b3f, #605c3c)", emojis: ["⚔️", "🎖️", "🪖", "💣"] },
  Western: { gradient: "linear-gradient(135deg, #b79891, #94716b)", emojis: ["🤠", "🐎", "🌵", "🔫"] },
};

export const defaultTheme: GenreTheme = {
  gradient: "linear-gradient(135deg, #2c3e50, #4a569d)",
  emojis: ["🎬", "🎞️"],
};