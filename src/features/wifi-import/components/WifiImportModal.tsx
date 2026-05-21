import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { QrScanner } from "./QrScanner";
import { useWifiImport } from "../hooks/useWifiImport";
import { isPairingPayload, type PairingPayload, type ShareManifest } from "../types";

interface Props {
  onClose: () => void;
  onToast?: (message: string) => void;
}

type Stage =
  | { kind: "scan" }
  | { kind: "connecting"; pairing: PairingPayload }
  | { kind: "select"; pairing: PairingPayload; manifest: ShareManifest }
  | { kind: "transferring" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function WifiImportModal({ onClose, onToast }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: "scan" });
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const wifi = useWifiImport();

  // Hardware back button closes the modal regardless of stage.
  useEffect(() => {
    const handle = CapacitorApp.addListener("backButton", () => onClose());
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [onClose]);

  async function handleScanResult(text: string) {
    if (stage.kind !== "scan") return;
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      setStage({ kind: "error", message: "El código escaneado no es un QR de Lumen." });
      return;
    }
    if (!isPairingPayload(payload)) {
      setStage({ kind: "error", message: "QR inválido o de otra versión." });
      return;
    }
    setStage({ kind: "connecting", pairing: payload });
    try {
      const manifest = await wifi.fetchManifest(payload);
      // Pre-select everything that isn't already on the device.
      const initialTracks = new Set<string>();
      for (const t of manifest.tracks) {
        if (!wifi.isExistingTrackId(t.id)) initialTracks.add(t.id);
      }
      const initialPlaylists = new Set<string>();
      for (const p of manifest.playlists) {
        if (!wifi.isExistingPlaylistId(p.id)) initialPlaylists.add(p.id);
      }
      setSelectedTracks(initialTracks);
      setSelectedPlaylists(initialPlaylists);
      setStage({ kind: "select", pairing: payload, manifest });
    } catch (err) {
      setStage({
        kind: "error",
        message: `No pude conectar al servidor: ${(err as Error).message}`,
      });
    }
  }

  async function handleTransfer() {
    if (stage.kind !== "select") return;
    setStage({ kind: "transferring" });
    try {
      const result = await wifi.transfer(
        stage.pairing,
        Array.from(selectedTracks),
        Array.from(selectedPlaylists),
        stage.manifest,
      );
      const parts: string[] = [];
      if (result.downloaded > 0) parts.push(`${result.downloaded} importadas`);
      if (result.skipped > 0) parts.push(`${result.skipped} ya estaban`);
      if (result.failed > 0) parts.push(`${result.failed} fallaron`);
      onToast?.(parts.join(" · ") || "Sin cambios");
      setStage({ kind: "done" });
    } catch (err) {
      setStage({
        kind: "error",
        message: `Transferencia falló: ${(err as Error).message}`,
      });
    }
  }

  const totalSelectedBytes = useMemo(() => {
    if (stage.kind !== "select") return 0;
    return stage.manifest.tracks
      .filter((t) => selectedTracks.has(t.id))
      .reduce((acc, t) => acc + (t.sizeBytes || 0), 0);
  }, [stage, selectedTracks]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex h-full w-full flex-col bg-zinc-950 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-zinc-800 overflow-hidden"
           style={{ paddingTop: "max(16px, env(safe-area-inset-top, 0px))" }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3">
          <h2 className="text-base font-semibold text-white">Importar desde PC</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {stage.kind === "scan" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Abrí Lumen en tu PC → Configuración → Compartir por WiFi, y apuntá la cámara al QR.
              </p>
              {!showManualPaste ? (
                <>
                  <QrScanner
                    onResult={handleScanResult}
                    onError={(err) => setStage({ kind: "error", message: err.message })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualPaste(true)}
                    className="w-full text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300 transition-colors"
                  >
                    Pegar código manualmente (test)
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                    Pegá el JSON del QR
                  </p>
                  <textarea
                    autoFocus
                    value={pasteValue}
                    onChange={(e) => setPasteValue(e.target.value)}
                    placeholder='{"v":1,"host":"192.168...","port":...,"token":"...","name":"..."}'
                    className="h-32 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowManualPaste(false); setPasteValue(""); }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleScanResult(pasteValue.trim())}
                      disabled={!pasteValue.trim()}
                      className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black disabled:opacity-40"
                    >
                      Conectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage.kind === "connecting" && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
              <p className="text-sm text-zinc-400">Conectando a {stage.pairing.name}…</p>
            </div>
          )}

          {stage.kind === "select" && (
            <SelectView
              manifest={stage.manifest}
              selectedTracks={selectedTracks}
              setSelectedTracks={setSelectedTracks}
              selectedPlaylists={selectedPlaylists}
              setSelectedPlaylists={setSelectedPlaylists}
              isExistingTrack={wifi.isExistingTrackId}
              isExistingPlaylist={wifi.isExistingPlaylistId}
            />
          )}

          {stage.kind === "transferring" && (
            <div className="space-y-4 py-6">
              <div className="space-y-2">
                <p className="text-sm text-zinc-300">
                  {wifi.progress.currentTitle ?? "Preparando…"}
                </p>
                <p className="text-xs text-zinc-500">
                  {wifi.progress.completed} / {wifi.progress.total}
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width: wifi.progress.total > 0
                      ? `${(wifi.progress.completed / wifi.progress.total) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {stage.kind === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-300">Listo</p>
              <p className="text-xs text-zinc-500 text-center">
                {wifi.progress.downloaded} importadas · {wifi.progress.skipped} ya estaban
                {wifi.progress.failed > 0 ? ` · ${wifi.progress.failed} fallaron` : ""}
              </p>
            </div>
          )}

          {stage.kind === "error" && (
            <div className="space-y-4 py-6">
              <p className="text-sm text-red-300">{stage.message}</p>
              <button
                type="button"
                onClick={() => setStage({ kind: "scan" })}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Footer (only in select stage and done) */}
        {stage.kind === "select" && (
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-5 py-3 flex items-center justify-between gap-3"
               style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}>
            <p className="text-xs text-zinc-500">
              {selectedTracks.size} pistas · {formatBytes(totalSelectedBytes)}
            </p>
            <button
              type="button"
              onClick={() => void handleTransfer()}
              disabled={selectedTracks.size === 0 && selectedPlaylists.size === 0}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Transferir
            </button>
          </div>
        )}

        {stage.kind === "done" && (
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-5 py-3 flex justify-end"
               style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Select view ──────────────────────────────────────── */

interface SelectViewProps {
  manifest: ShareManifest;
  selectedTracks: Set<string>;
  setSelectedTracks: (s: Set<string>) => void;
  selectedPlaylists: Set<string>;
  setSelectedPlaylists: (s: Set<string>) => void;
  isExistingTrack: (id: string) => boolean;
  isExistingPlaylist: (id: string) => boolean;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function SelectView({
  manifest,
  selectedTracks,
  setSelectedTracks,
  selectedPlaylists,
  setSelectedPlaylists,
  isExistingTrack,
  isExistingPlaylist,
}: SelectViewProps) {
  const [search, setSearch] = useState("");

  const toggleTrack = (id: string) => {
    const next = new Set(selectedTracks);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTracks(next);
  };
  const togglePlaylist = (id: string) => {
    const nextPlaylists = new Set(selectedPlaylists);
    const nextTracks = new Set(selectedTracks);
    if (nextPlaylists.has(id)) {
      // Don't auto-deselect the playlist's tracks — the user may want them
      // independently.
      nextPlaylists.delete(id);
    } else {
      nextPlaylists.add(id);
      const playlist = manifest.playlists.find((p) => p.id === id);
      if (playlist) {
        const inManifest = new Set(manifest.tracks.map((t) => t.id));
        for (const tid of playlist.trackIds) {
          if (inManifest.has(tid)) nextTracks.add(tid);
        }
      }
    }
    setSelectedPlaylists(nextPlaylists);
    setSelectedTracks(nextTracks);
  };

  // Tracks visible after search filter. Empty query → all tracks.
  const visibleTracks = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return manifest.tracks;
    return manifest.tracks.filter(
      (t) =>
        normalize(t.title).includes(q) ||
        normalize(t.artist).includes(q) ||
        (t.album && normalize(t.album).includes(q)),
    );
  }, [manifest.tracks, search]);

  // The select-all/none buttons act on what's currently visible. So if the
  // user searched "quevedo" they can select only those, not the whole library.
  const allVisibleSelected = visibleTracks.length > 0 && visibleTracks.every((t) => selectedTracks.has(t.id));
  const toggleAllVisible = () => {
    const next = new Set(selectedTracks);
    if (allVisibleSelected) {
      for (const t of visibleTracks) next.delete(t.id);
    } else {
      for (const t of visibleTracks) next.add(t.id);
    }
    setSelectedTracks(next);
  };

  // Playlists toggle: select or clear all of them.
  const allPlaylistsSelected =
    manifest.playlists.length > 0 && manifest.playlists.every((p) => selectedPlaylists.has(p.id));
  const toggleAllPlaylists = () => {
    const nextPlaylists = new Set(selectedPlaylists);
    const nextTracks = new Set(selectedTracks);
    if (allPlaylistsSelected) {
      for (const p of manifest.playlists) nextPlaylists.delete(p.id);
      // Same as single-toggle: don't strip out tracks the user may want.
    } else {
      const inManifest = new Set(manifest.tracks.map((t) => t.id));
      for (const p of manifest.playlists) {
        nextPlaylists.add(p.id);
        for (const tid of p.trackIds) {
          if (inManifest.has(tid)) nextTracks.add(tid);
        }
      }
    }
    setSelectedPlaylists(nextPlaylists);
    setSelectedTracks(nextTracks);
  };

  const newTracksCount = manifest.tracks.filter((t) => !isExistingTrack(t.id)).length;

  return (
    <div className="space-y-5 py-2">
      <div>
        <p className="text-sm font-medium text-white">{manifest.tracks.length} pistas en {manifest.serverName}</p>
        <p className="text-xs text-zinc-500">{newTracksCount} no están todavía en este celular</p>
      </div>

      {/* Playlists */}
      {manifest.playlists.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              Playlists · {selectedPlaylists.size}/{manifest.playlists.length}
            </p>
            <button
              type="button"
              onClick={toggleAllPlaylists}
              className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {allPlaylistsSelected ? "Ninguna" : "Todas"}
            </button>
          </div>
          <ul>
            {manifest.playlists.map((p) => {
              const isSelected = selectedPlaylists.has(p.id);
              const exists = isExistingPlaylist(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => togglePlaylist(p.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-900 transition-colors"
                  >
                    <span className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      isSelected ? "border-white bg-white text-black" : "border-zinc-600",
                    ].join(" ")}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">{p.name}</p>
                      <p className="text-[11px] text-zinc-600">{p.trackIds.length} pistas{exists ? " · ya existe (se actualiza)" : ""}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tracks */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">
            Pistas · {selectedTracks.size}/{manifest.tracks.length}
          </p>
          {visibleTracks.length > 0 && (
            <button
              type="button"
              onClick={toggleAllVisible}
              className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {allVisibleSelected
                ? (search ? "Ninguna filtrada" : "Ninguna")
                : (search ? "Todas filtradas" : "Todas")}
            </button>
          )}
        </div>

        {/* Search input — filters by title, artist, or album */}
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, artista o álbum"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-9 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
              </svg>
            </button>
          )}
        </div>

        {visibleTracks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-600">Sin resultados para "{search}"</p>
        ) : (
          <ul>
            {visibleTracks.map((t) => {
              const isSelected = selectedTracks.has(t.id);
              const exists = isExistingTrack(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggleTrack(t.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-900 transition-colors disabled:opacity-50"
                  >
                    <span className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      isSelected ? "border-white bg-white text-black" : "border-zinc-600",
                    ].join(" ")}>
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={["truncate text-sm", exists ? "text-zinc-500" : "text-zinc-200"].join(" ")}>{t.title}</p>
                      <p className="truncate text-[11px] text-zinc-600">
                        {t.artist}
                        {exists ? " · ya en tu biblioteca" : ""}
                        {!exists && t.sizeBytes > 0 ? ` · ${formatBytes(t.sizeBytes)}` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
