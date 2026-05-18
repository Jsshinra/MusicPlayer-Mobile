import { useRef, useState } from "react";
import { useFileImport } from "../hooks/useFileImport";

interface ImportFabProps {
  onToast: (message: string) => void;
}

function IconPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function ImportFab({ onToast }: ImportFabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importFiles } = useFileImport();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const result = await importFiles(files);
      if (result.imported > 0) {
        onToast(
          result.imported === 1
            ? "1 canción importada"
            : `${result.imported} canciones importadas`,
        );
      } else if (result.skipped > 0) {
        onToast("Solo se aceptan archivos de audio");
      } else if (result.errors > 0) {
        onToast("No se pudo importar ninguna canción");
      }
    } catch (err) {
      console.error("[import] unexpected error", err);
      onToast("Error al importar");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.flac,.ogg,.wav,.aac,.opus"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label="Importar música"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/40 transition-transform active:scale-95 disabled:opacity-80"
        style={{ bottom: `calc(150px + env(safe-area-inset-bottom, 0px))` }}
      >
        {busy ? <IconSpinner /> : <IconPlus />}
      </button>
    </>
  );
}
