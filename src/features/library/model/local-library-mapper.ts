import { parseBlob } from "music-metadata-browser";
import { Track } from "../../../shared/types/music";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";

const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "flac",
  "aac",
  "webm",
]);

function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? SUPPORTED_AUDIO_EXTENSIONS.has(ext) : false;
}

function titleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  return withoutExt.trim().length > 0 ? withoutExt : fileName;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/[\x00-\x1F\x7F]/g, "")  // strip control chars / null bytes from ID3 tags
    .replace(/_/g, " ")
    .replace(/\s*[|\/\\]\s*/g, " - ")
    // Remove () or [] blocks that contain known YT/promo keywords
    .replace(/\s*[\(\[][^\)\]]*(?:official|oficial|lyric|video|audio|visualizer|hd|hq|4k|mv|vevo|clip|explicit|clean|remix|version|edit|m[uú]sica?)s?[^\)\]]*[\)\]]\s*/gi, "")
    // Remove trailing standalone promo keywords preceded by at least one separator
    .replace(/[\s–—-]+(?:official(?:\s+(?:music\s+)?(?:video|audio))?|oficial(?:\s+(?:music\s+)?(?:video|audio))?|lyric\s+video|visualizer|mv)\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function mapFileToTrack(file: File, _index: number): Promise<Track> {
  const fileWithPath = file as File & { path?: string };
  const localPath = fileWithPath.path;
const uri = localPath ? localPathToFileUri(localPath) : URL.createObjectURL(file);

  let title = cleanTitle(titleFromFileName(file.name));
  let artist = "Unknown artist";
  let album: string | undefined;
  let durationMs = 0;
  let artworkUrl: string | undefined;

  try {
    const meta = await parseBlob(file, { skipPostHeaders: true });
    const { common, format } = meta;

    if (common.title?.trim()) title = cleanTitle(common.title.trim());
    if (common.artist?.trim()) artist = common.artist.trim();
    if (common.album?.trim()) album = common.album.trim();
    if (format.duration && Number.isFinite(format.duration)) {
      durationMs = Math.floor(format.duration * 1000);
    }

    const pic = common.picture?.[0];
    if (pic) {
      const blob = new Blob([pic.data.buffer as ArrayBuffer], { type: pic.format });
      artworkUrl = URL.createObjectURL(blob);
    }
  } catch {
    // metadata parse failed — fall back to filename-derived values
  }

  return {
    id: `local-${file.name}-${file.lastModified}`,
    source: "local",
    title,
    artist,
    album,
    durationMs,
    artworkUrl,
    uri,
    localPath,
  };
}

export async function mapFilesToLocalTracks(files: File[]): Promise<Track[]> {
  const audioFiles = files.filter(isAudioFile);
  return Promise.all(audioFiles.map(mapFileToTrack));
}
