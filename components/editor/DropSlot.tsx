"use client";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon, VideoIcon, ClipboardPaste } from "lucide-react";
import { useRef, useState, DragEvent, ChangeEvent } from "react";

export interface DropResult {
  file: File;
  kind: "image" | "video";
  objectUrl: string;
}

interface Props {
  accept: "image" | "video" | "both";
  filled: boolean;
  thumbnail?: string | null;
  thumbnailKind?: "image" | "video" | null;
  label: string;
  hint?: string;
  onDrop: (r: DropResult) => void;
  onClear?: () => void;
  onFocus?: () => void;
  active?: boolean;
  className?: string;
}

export function DropSlot({
  accept,
  filled,
  thumbnail,
  thumbnailKind,
  label,
  hint,
  onDrop,
  onClear,
  onFocus,
  active,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const acceptStr =
    accept === "image"
      ? "image/*"
      : accept === "video"
        ? "video/*"
        : "image/*,video/*";

  const handleFiles = (files: FileList | File[] | null | undefined) => {
    if (!files) return;
    const arr = Array.from(files);
    const file = arr[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (accept === "image" && !isImage) return;
    if (accept === "video" && !isVideo) return;
    if (!isImage && !isVideo) return;
    onDrop({
      file,
      kind: isImage ? "image" : "video",
      objectUrl: URL.createObjectURL(file),
    });
  };

  return (
    <div
      onClick={() => {
        onFocus?.();
        inputRef.current?.click();
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        handleFiles(e.dataTransfer?.files);
      }}
      className={cn(
        "group relative w-full aspect-video rounded-xl border border-dashed bg-white/[0.02] overflow-hidden transition cursor-pointer",
        over || active
          ? "border-accent/70 bg-accent/5"
          : "border-border hover:border-white/30 hover:bg-white/[0.04]",
        className,
      )}
    >
      {filled && thumbnail ? (
        <div className="absolute inset-0">
          {thumbnailKind === "video" ? (
            <video
              src={thumbnail}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-white/80 inline-flex items-center gap-1.5 px-2 h-6 rounded-md bg-black/40 backdrop-blur">
              {thumbnailKind === "video" ? <VideoIcon size={12} /> : <ImageIcon size={12} />}
              {label}
            </span>
            {onClear && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-black/40 backdrop-blur hover:bg-black/60 text-white/90 transition"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
          <Upload size={18} />
          <div className="text-xs font-medium text-text/80">{label}</div>
          <div className="text-[11px] flex items-center gap-1 text-muted">
            <ClipboardPaste size={11} />
            {hint ?? "Drop, click, or paste"}
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
    </div>
  );
}
