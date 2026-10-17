type SoundName = "click";

let context: AudioContext | undefined;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<AudioBuffer | undefined>>();

function audioContext() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return undefined;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function load(audio: AudioContext, name: SoundName) {
  const cached = buffers.get(name);
  if (cached) return Promise.resolve(cached);
  const inFlight = loading.get(name);
  if (inFlight) return inFlight;

  const task = fetch(`/sounds/${name}.wav`)
    .then((response) => {
      if (!response.ok) throw new Error(`Couldn't load the ${name} sound.`);
      return response.arrayBuffer();
    })
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      return buffer;
    })
    .catch(() => undefined);

  loading.set(name, task);
  return task;
}

function start(audio: AudioContext, buffer: AudioBuffer) {
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  source.start();
}

export async function playSound(name: SoundName) {
  const audio = audioContext();
  if (!audio) return;
  const buffer = buffers.get(name) ?? (await load(audio, name));
  if (buffer) start(audio, buffer);
}

export function preloadSounds(names: readonly SoundName[]) {
  const audio = audioContext();
  if (!audio) return;
  for (const name of names) void load(audio, name);
}
