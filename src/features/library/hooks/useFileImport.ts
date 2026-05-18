import { useCallback } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { parseBlob } from "music-metadata-browser";
import { useAppStore } from "../../../app/store/useAppStore";
import type { Track } from "../../../shared/types/music";
import { localPathToFileUri } from "../../../shared/utils/local-file-uri";

const MUSIC_DIR = "music";
const ARTWORK_DIR = "artwork";
const AUDIO_EXT = /\.(mp3|m4a|flac|ogg|wav|aac|webm|opus)$/i;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

async function importOne(file: File): Promise<Track> {
  const id = `local-${crypto.randomUUID()}`;

  let title = file.name.replace(/\.[^/.]+$/, "");
  let artist = "Unknown";
  let album: string | undefined;
  let durationMs = 0;
  let artworkBlob: Blob | undefined;

  try {
    const meta = await parseBlob(file);
    if (meta.common.title?.trim()) title = meta.common.title.trim();
    if (meta.common.artist?.trim()) artist = meta.common.artist.trim();
    if (meta.common.album?.trim()) album = meta.common.album.trim();
    if (meta.format.duration && Number.isFinite(meta.format.duration)) {
      durationMs = Math.floor(meta.format.duration * 1000);
    }
    const pic = meta.common.picture?.[0];
    if (pic) {
      artworkBlob = new Blob([pic.data.buffer as ArrayBuffer], { type: pic.format });
    }
  } catch (err) {
    console.warn("[import] metadata parse failed", err);
  }

  const audioExt = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const audioBase64 = await blobToBase64(file);
  const audioRes = await Filesystem.writeFile({
    path: `${MUSIC_DIR}/${id}.${audioExt}`,
    data: audioBase64,
    directory: Directory.Data,
    recursive: true,
  });

  let artworkUrl: string | undefined;
  if (artworkBlob) {
    const artExt = artworkBlob.type.split("/")[1] || "jpg";
    const artBase64 = await blobToBase64(artworkBlob);
    const artRes = await Filesystem.writeFile({
      path: `${ARTWORK_DIR}/${id}.${artExt}`,
      data: artBase64,
      directory: Directory.Data,
      recursive: true,
    });
    artworkUrl = localPathToFileUri(artRes.uri);
  }

  return {
    id,
    source: "local",
    title,
    artist,
    album,
    durationMs,
    uri: localPathToFileUri(audioRes.uri),
    localPath: audioRes.uri,
    artworkUrl,
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
}

export function useFileImport() {
  const appendLibraryTracks = useAppStore((s) => s.appendLibraryTracks);

  const importFiles = useCallback(
    async (files: FileList | File[] | null): Promise<ImportResult> => {
      if (!files) return { imported: 0, skipped: 0, errors: 0 };
      const list = Array.from(files);
      const audioFiles = list.filter(
        (f) => f.type.startsWith("audio/") || AUDIO_EXT.test(f.name),
      );

      const results = await Promise.allSettled(audioFiles.map(importOne));
      const tracks: Track[] = [];
      let errors = 0;
      for (const r of results) {
        if (r.status === "fulfilled") tracks.push(r.value);
        else {
          errors++;
          console.error("[import] failed", r.reason);
        }
      }

      if (tracks.length > 0) appendLibraryTracks(tracks);

      return {
        imported: tracks.length,
        skipped: list.length - audioFiles.length,
        errors,
      };
    },
    [appendLibraryTracks],
  );

  return { importFiles };
}
