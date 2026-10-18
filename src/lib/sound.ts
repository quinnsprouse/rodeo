type SoundName = "click";

const players = new Map<SoundName, HTMLAudioElement>();

function player(name: SoundName) {
  if (typeof window === "undefined") return undefined;
  const existing = players.get(name);
  if (existing) return existing;
  const audio = new Audio(`/sounds/${name}.wav`);
  audio.preload = "auto";
  players.set(name, audio);
  return audio;
}

export async function playSound(name: SoundName) {
  const audio = player(name);
  if (!audio) return;
  audio.currentTime = 0;
  await audio.play().catch(() => undefined);
}

export function preloadSounds(names: readonly SoundName[]) {
  for (const name of names) player(name);
}
