import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "../../../app/store/useAppStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import {
  computeStorageBreakdown,
  deleteOrphans,
  findOrphans,
  formatBytes,
  type StorageBreakdown,
} from "../storage-utils";

interface Props {
  onToast?: (message: string) => void;
}

export function StorageSection({ onToast }: Props) {
  const t = useTranslation();
  const tracks = useAppStore((s) => s.libraryTracks);
  const playlists = useAppStore((s) => s.playlists);

  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [orphanCount, setOrphanCount] = useState<number>(0);
  const [orphanBytes, setOrphanBytes] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const refresh = useCallback(async () => {
    setScanning(true);
    try {
      const [b, o] = await Promise.all([
        computeStorageBreakdown(),
        findOrphans(tracks, playlists),
      ]);
      setBreakdown(b);
      setOrphanCount(o.paths.length);
      setOrphanBytes(o.bytes);
    } finally {
      setScanning(false);
    }
  }, [tracks, playlists]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleClean() {
    setCleaning(true);
    try {
      const o = await findOrphans(tracks, playlists);
      if (o.paths.length === 0) {
        onToast?.(t.storageNoOrphans);
        await refresh();
        return;
      }
      const deleted = await deleteOrphans(o.paths);
      onToast?.(t.storageCleanResult(deleted, formatBytes(o.bytes)));
      await refresh();
    } finally {
      setCleaning(false);
    }
  }

  const total =
    (breakdown?.music.bytes ?? 0) +
    (breakdown?.artwork.bytes ?? 0) +
    (breakdown?.covers.bytes ?? 0);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-white">{t.storageLabel}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{t.storageDescription}</p>
      </div>

      <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/60">
        <StorageRow label={t.storageMusic} info={breakdown ? `${breakdown.music.files}` : "—"} value={formatBytes(breakdown?.music.bytes ?? 0)} />
        <StorageRow label={t.storageArtwork} info={breakdown ? `${breakdown.artwork.files}` : "—"} value={formatBytes(breakdown?.artwork.bytes ?? 0)} />
        <StorageRow label={t.storageCovers} info={breakdown ? `${breakdown.covers.files}` : "—"} value={formatBytes(breakdown?.covers.bytes ?? 0)} />
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs uppercase tracking-widest text-zinc-600">Total</span>
          <span className="text-sm font-medium text-zinc-200">{formatBytes(total)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-800/60 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-200">{t.storageOrphansLabel}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {scanning
              ? "…"
              : orphanCount === 0
                ? t.storageNoOrphans
                : `${orphanCount} · ${formatBytes(orphanBytes)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleClean()}
          disabled={cleaning || orphanCount === 0}
          className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cleaning ? t.storageCleaningButton : t.storageCleanButton}
        </button>
      </div>
    </div>
  );
}

function StorageRow({ label, info, value }: { label: string; info: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-200">{label}</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">{info} archivos</p>
      </div>
      <span className="text-sm tabular-nums text-zinc-300">{value}</span>
    </div>
  );
}
