"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import {
  Upload,
  X,
  Plus,
  ImageIcon,
  AlertCircle,
  Loader2,
  Check,
  Crop,
  Star,
  Video,
} from "lucide-react";
import api from "../../lib/api";
import { getAdminAuthHeaders } from "../../lib/adminAuth";
import { t } from "../../lib/admin-i18n";
import { normalizeVideoAdjustments } from "../../lib/videoAdjustments";

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", t.freeSize];
const PRODUCT_CATEGORIES = [
  "New In",
  "Sets",
  "Dresses",
  "Tops",
  "Bottoms",
  "Blazers",
  "Sale",
];
const ACCENT_GOLD = "#C8A96E";
const MAX_IMAGE_LONG_EDGE = 1200;
const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Prefer JSON `{ message }` from failed upload XHR; else status + short body (avoids vague "upload error" only). */
function xhrErrorDetail(xhr, fallbackLabel) {
  const raw = xhr.responseText?.trim() || "";
  if (raw) {
    try {
      const j = JSON.parse(raw);
      const msg = j?.message ?? j?.error;
      if (msg != null && String(msg).trim()) return String(msg).trim();
    } catch {
      const snippet = raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
      if (!snippet.includes("<!DOCTYPE")) {
        return `${fallbackLabel} (HTTP ${xhr.status}): ${snippet}`;
      }
    }
  }
  return `${fallbackLabel} (HTTP ${xhr.status}${xhr.statusText ? ` ${xhr.statusText}` : ""})`;
}

/**
 * Scales image so the longest side is at most maxLongEdge (Canvas API).
 */
async function compressImageToMaxDimension(file, maxLongEdge = MAX_IMAGE_LONG_EDGE) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image load failed"));
      image.src = objectUrl;
    });
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const maxSide = Math.max(w, h);
    let outW = w;
    let outH = h;
    if (maxSide > maxLongEdge) {
      const scale = maxLongEdge / maxSide;
      outW = Math.round(w * scale);
      outH = Math.round(h * scale);
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    canvas.width = outW;
    canvas.height = outH;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, outW, outH);

    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = mime === "image/png" ? undefined : 0.88;

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const base = file.name.replace(/\.[^.]+$/, "") || "photo";
          const ext = mime === "image/png" ? "png" : "jpg";
          const outFile = new File([blob], `${base}.${ext}`, { type: mime });
          resolve({
            file: outFile,
            width: outW,
            height: outH,
            bytes: blob.size,
          });
        },
        mime,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function arrayMove(arr, from, to) {
  if (from === to) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function newImageId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function loadImageForCrop(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = async () => {
      try {
        const r = await fetch(src);
        const blob = await r.blob();
        const u = URL.createObjectURL(blob);
        const img2 = new Image();
        img2.onload = () => {
          URL.revokeObjectURL(u);
          resolve(img2);
        };
        img2.onerror = () => {
          URL.revokeObjectURL(u);
          reject(new Error("Image load failed"));
        };
        img2.src = u;
      } catch (e) {
        reject(e);
      }
    };
    img.src = src;
  });
}

async function fileFromCroppedCanvas(imageSrc, pixelCrop, adjustments = {}) {
  const image = await loadImageForCrop(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { width: cw, height: ch, x, y } = pixelCrop;
  const outW = cw;
  const outH = ch;

  canvas.width = outW;
  canvas.height = outH;
  const brightness = Number.isFinite(adjustments.brightness)
    ? adjustments.brightness
    : 100;
  const contrast = Number.isFinite(adjustments.contrast)
    ? adjustments.contrast
    : 100;
  const saturation = Number.isFinite(adjustments.saturation)
    ? adjustments.saturation
    : 100;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(image, x, y, cw, ch, 0, 0, outW, outH);
  ctx.filter = "none";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Export failed"));
          return;
        }
        resolve(
          new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
        );
      },
      "image/jpeg",
      0.92
    );
  });
}

function ImageCropModal({ imageSrc, onClose, onApply }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectMode, setAspectMode] = useState("34");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const croppedPixelsRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const aspect = useMemo(() => {
    const modes = {
      free: undefined,
      "34": 3 / 4,
      "11": 1,
      "45": 4 / 5,
    };
    return modes[aspectMode];
  }, [aspectMode]);

  const onCropComplete = useCallback((_a, areaPixels) => {
    croppedPixelsRef.current = areaPixels;
  }, []);

  const handleApply = async () => {
    const pixels = croppedPixelsRef.current;
    if (!pixels) return;
    setBusy(true);
    try {
      const file = await fileFromCroppedCanvas(imageSrc, pixels, {
        brightness,
        contrast,
        saturation,
      });
      await onApply(file);
    } finally {
      setBusy(false);
    }
  };

  const modes = useMemo(
    () => [
      { key: "free", label: t.aspectFree },
      { key: "34", label: t.aspect34 },
      { key: "11", label: t.aspect11 },
      { key: "45", label: t.aspect45 },
    ],
    []
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-xl">
        <div className="border-b border-[var(--color-line)] px-4 py-3">
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/55">
            {t.cropModalTitle}
          </h4>
        </div>
        <div className="relative h-[min(56vh,420px)] w-full bg-neutral-900">
          <div
            className="absolute inset-0"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        </div>
        <div className="space-y-3 border-t border-[var(--color-line)] px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setAspectMode(m.key)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  aspectMode === m.key
                    ? "bg-[var(--color-green)] text-white"
                    : "bg-[var(--color-cream)] text-black/60 hover:bg-black/[0.04]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-black/45">
              {t.zoomLabel}
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--color-green)]"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Brightness ({brightness}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Contrast ({contrast}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Saturation ({saturation}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setBrightness(100);
                setContrast(100);
                setSaturation(100);
              }}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-black/60 transition hover:bg-black/[0.04] hover:text-black"
            >
              Reset Adjustments
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-[12px] font-medium text-black/70 transition hover:bg-black/[0.04]"
            >
              {t.cancelCrop}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleApply}
              className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-[12px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? t.cropping : t.applyCrop}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                              */
/* ------------------------------------------------------------------ */

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CollapsibleCard({ title, defaultOpen = false, summaryRight, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="group rounded-xl border border-[var(--color-line)] bg-white shadow-sm"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
          {title}
        </span>
        <span className="flex items-center gap-3">
          {summaryRight ? (
            <span className="text-[12px] text-black/45">{summaryRight}</span>
          ) : null}
          <span className="text-[12px] text-black/35 transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </details>
  );
}

function FieldLabel({ htmlFor, required, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[12px] font-medium tracking-[0.03em] text-black/60"
    >
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-[var(--color-green)]" : "bg-black/15"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[1.375rem]" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-[13px] text-black/70">{label}</span>
    </label>
  );
}

function TagInput({ tags, setTags, placeholder, suggestions }) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const addTag = useCallback(
    (value) => {
      const trimmed = value.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setInputValue("");
    },
    [tags, setTags]
  );

  const removeTag = useCallback(
    (index) => setTags(tags.filter((_, i) => i !== index)),
    [tags, setTags]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const filteredSuggestions = suggestions?.filter(
    (s) =>
      !tags.includes(s) &&
      s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 transition-colors focus-within:border-[var(--color-gold)]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-cream)] px-2.5 py-1 text-[12px] font-medium text-black/70"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="ml-0.5 rounded-full p-0.5 text-black/30 transition-colors hover:bg-black/10 hover:text-black/60"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 border-none bg-transparent py-0.5 text-[13px] outline-none placeholder:text-black/30"
        />
      </div>

      {showSuggestions && filteredSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-[var(--color-line)] bg-white py-1 shadow-lg">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
              }}
              className="flex w-full px-3 py-1.5 text-left text-[12px] text-black/60 transition-colors hover:bg-[var(--color-cream)] hover:text-black"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full-screen image preview                                          */
/* ------------------------------------------------------------------ */

function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.imagePreviewDialog}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[201] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition hover:bg-black/60"
        aria-label={t.closePreview}
      >
        <X size={22} strokeWidth={2} />
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[min(92vh,1400px)] max-w-[min(96vw,1400px)] select-none object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image cards – large previews, drag reorder, cover badge            */
/* ------------------------------------------------------------------ */

function RemoteImageMetaLine({ url }) {
  const [dims, setDims] = useState(null);
  const [bytes, setBytes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.onerror = () => {
      if (!cancelled) setDims(null);
    };
    img.src = url;

    fetch(url)
      .then((r) => r.blob())
      .then((b) => {
        if (!cancelled) setBytes(b.size);
      })
      .catch(() => {
        if (!cancelled) setBytes(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const line =
    dims != null
      ? `${dims.w} × ${dims.h}${bytes != null ? ` · ${formatBytes(bytes)}` : ""}`
      : "…";

  return (
    <p className="truncate text-[11px] tabular-nums text-black/50" title={line}>
      {line}
    </p>
  );
}

function ProductImageCard({
  src,
  itemId,
  isCover,
  showCoverAction,
  progress,
  onRemove,
  onCrop,
  onSetCover,
  onDragStart,
  onDragOver,
  onDrop,
  onPhotoClick,
  metaNew,
}) {
  const dragPointerRef = useRef(null);
  const suppressClickAfterDragRef = useRef(false);

  const handlePhotoMouseDownCapture = (e) => {
    dragPointerRef.current = e.target instanceof Element && e.target.closest("button") ? "ui" : "photo";
  };

  const handlePhotoDragStart = (e) => {
    if (dragPointerRef.current === "ui") {
      e.preventDefault();
      dragPointerRef.current = null;
      return;
    }
    dragPointerRef.current = null;
    onDragStart(e, itemId);
  };

  const handlePhotoDragEnd = () => {
    suppressClickAfterDragRef.current = true;
    window.setTimeout(() => {
      suppressClickAfterDragRef.current = false;
    }, 150);
  };

  const handlePhotoClick = (e) => {
    if (e.target instanceof Element && e.target.closest("[data-image-toolbar]")) return;
    if (suppressClickAfterDragRef.current) return;
    onPhotoClick?.(src);
  };

  return (
    <div
      className="group relative mx-auto flex w-full max-w-[220px] flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-neutral-100 shadow-sm transition-shadow hover:shadow-md sm:max-w-[240px]"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        title={t.photoPreviewHint}
        draggable
        onMouseDownCapture={handlePhotoMouseDownCapture}
        onDragStart={handlePhotoDragStart}
        onDragEnd={handlePhotoDragEnd}
        onClick={handlePhotoClick}
        className="relative aspect-[3/4] w-full cursor-zoom-in select-none overflow-hidden bg-neutral-200 active:cursor-grabbing"
      >
        <img
          src={src}
          alt=""
          className="pointer-events-none h-full w-full object-cover"
          draggable={false}
        />

        {typeof progress === "number" && progress < 100 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45">
            <Loader2 size={22} className="animate-spin text-white" />
            <span className="mt-2 text-[12px] font-medium text-white">{progress}%</span>
          </div>
        )}

        {typeof progress === "number" && progress === 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg"
              style={{ backgroundColor: ACCENT_GOLD }}
            >
              <Check size={18} strokeWidth={3} />
            </div>
          </div>
        )}

        {isCover && (
          <span
            className="pointer-events-none absolute left-2 top-2 z-[2] rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-md"
            style={{ backgroundColor: ACCENT_GOLD }}
          >
            {t.cover}
          </span>
        )}

        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/20 group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-1.5 pb-1.5 pt-8 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <div
            data-image-toolbar
            className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/55 p-0.5 shadow-lg backdrop-blur-md"
            onMouseDownCapture={() => {
              dragPointerRef.current = "ui";
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              draggable={false}
              title={t.cropImage}
              aria-label={t.cropImage}
              onClick={onCrop}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/95 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60"
            >
              <Crop size={14} strokeWidth={2} className="shrink-0" />
            </button>
            {showCoverAction && (
              <button
                type="button"
                draggable={false}
                title={t.setAsCover}
                aria-label={t.setAsCover}
                onClick={onSetCover}
                className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60"
                style={{ color: ACCENT_GOLD }}
              >
                <Star size={14} strokeWidth={2} className="shrink-0" />
              </button>
            )}
            <button
              type="button"
              draggable={false}
              title={t.delete}
              aria-label={t.delete}
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-md text-red-200 transition hover:bg-red-600/90 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-300/80"
            >
              <X size={14} strokeWidth={2.5} className="shrink-0" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.06] bg-white px-2.5 py-2">
        {metaNew ? (
          <p className="truncate text-[11px] tabular-nums text-black/50" title={`${metaNew.w} × ${metaNew.h} · ${formatBytes(metaNew.bytes)}`}>
            {metaNew.w} × {metaNew.h} · {formatBytes(metaNew.bytes)}
          </p>
        ) : (
          <RemoteImageMetaLine url={src} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main form                                                          */
/* ------------------------------------------------------------------ */

export default function ProductForm({
  mode = "create",
  initialProduct = null,
  onSuccess,
}) {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const stockInputRef = useRef(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [allowSeparatePurchase, setAllowSeparatePurchase] = useState(false);
  const [bundleFullSetPrice, setBundleFullSetPrice] = useState("");
  const [bundleTopPrice, setBundleTopPrice] = useState("");
  const [bundleBottomPrice, setBundleBottomPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("0");
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [featured, setFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  const [imageItems, setImageItems] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [cropModal, setCropModal] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [cardVideoUrl, setCardVideoUrl] = useState("");
  const [videoBrightness, setVideoBrightness] = useState(100);
  const [videoContrast, setVideoContrast] = useState(100);
  const [videoSaturation, setVideoSaturation] = useState(100);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [categories, setCategories] = useState([]);

  const isCreateMode = mode === "create";

  const [matchCandidates, setMatchCandidates] = useState([]);
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");

  const submitLabel = mode === "edit" ? t.saveChanges : t.saveProduct;

  const hasHydrated = useRef(false);

  useEffect(() => {
    api
      .get("/api/products")
      .then(({ data }) => {
        const cats = [
          ...new Set(
            [
              ...PRODUCT_CATEGORIES,
              ...(Array.isArray(data) ? data.map((p) => p?.category) : []),
            ]
              .map((value) => (typeof value === "string" ? value.trim() : ""))
              .filter(Boolean)
          ),
        ];
        setCategories(cats.sort());
      })
      .catch(() => {});
  }, []);

  const selectedExisting = useMemo(() => {
    if (!selectedExistingId) return null;
    return matchCandidates.find((p) => p?._id === selectedExistingId) || null;
  }, [matchCandidates, selectedExistingId]);

  useEffect(() => {
    if (!isCreateMode) return;
    if (selectedExistingId) return; // stop searching when user picked one

    const query = (code || name).trim();
    if (query.length < 3) {
      setMatchCandidates([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearchingMatches(true);
        const { data } = await api.get("/api/products", {
          params: { page: 1, limit: 5, search: query },
        });
        const products = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : [];
        setMatchCandidates(products);
      } catch {
        setMatchCandidates([]);
      } finally {
        setIsSearchingMatches(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [code, isCreateMode, name, selectedExistingId]);

  const hydrateForm = useCallback((product) => {
    if (!product) return;
    setCode(product.code || "");
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(String(product.priceUSD ?? ""));
    setDiscountPrice(String(product.discountPriceUSD ?? ""));
    setAllowSeparatePurchase(Boolean(product.allowSeparatePurchase));
    setBundleFullSetPrice(String(product.bundleFullSetPriceUSD ?? ""));
    setBundleTopPrice(String(product.bundleTopPriceUSD ?? ""));
    setBundleBottomPrice(String(product.bundleBottomPriceUSD ?? ""));
    setCategory(product.category || "");
    setStock(String(product.stock ?? 0));
    setSizes(Array.isArray(product.sizes) ? product.sizes : []);
    setColors(Array.isArray(product.colors) ? product.colors : []);
    setFeatured(Boolean(product.featured));
    setIsBestSeller(Boolean(product.isBestSeller));
    setIsNewArrival(Boolean(product.isNewArrival));
    const urls = Array.isArray(product.images) ? product.images : [];
    setImageItems(
      urls.map((url) => ({
        id: `ex-${url}`,
        kind: "existing",
        url,
      }))
    );
    setUploadProgress({});
    setCropModal(null);
    setCardVideoUrl(
      typeof product.cardVideoUrl === "string" ? product.cardVideoUrl : ""
    );
    const videoFx = normalizeVideoAdjustments(product.cardVideoAdjustments);
    setVideoBrightness(videoFx.brightness);
    setVideoContrast(videoFx.contrast);
    setVideoSaturation(videoFx.saturation);
    setVideoUploadProgress(null);
  }, []);

  useEffect(() => {
    if (mode === "edit" && initialProduct && !hasHydrated.current) {
      hydrateForm(initialProduct);
      hasHydrated.current = true;
    }
  }, [initialProduct, mode, hydrateForm]);

  /* ---------- Image handling ---------- */

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const rejected = [];
    const compressedItems = [];

    for (const file of files) {
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        rejected.push(`${file.name} (>10 MB)`);
        continue;
      }
      try {
        const { file: out, width, height, bytes } =
          await compressImageToMaxDimension(file);
        compressedItems.push({
          kind: "new",
          id: newImageId(),
          file: out,
          preview: URL.createObjectURL(out),
          width,
          height,
          bytes,
        });
      } catch {
        rejected.push(file.name);
      }
    }

    if (rejected.length > 0) {
      setErrorMessage(
        `Some images could not be added: ${rejected.join(", ")}`
      );
    } else {
      setErrorMessage("");
    }

    if (compressedItems.length === 0) return;
    setImageItems((prev) => [...prev, ...compressedItems]);
  }, []);

  const removeImage = useCallback((id) => {
    setImageItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.kind === "new") URL.revokeObjectURL(item.preview);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const setAsCover = useCallback((id) => {
    setImageItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx <= 0) return prev;
      return arrayMove(prev, idx, 0);
    });
  }, []);

  const handleThumbDragStart = useCallback((e, itemId) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleThumbDrop = useCallback((e, targetId) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData("text/plain");
    if (!fromId || fromId === targetId) return;
    setImageItems((prev) => {
      const fromIdx = prev.findIndex((x) => x.id === fromId);
      const toIdx = prev.findIndex((x) => x.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      return arrayMove(prev, fromIdx, toIdx);
    });
  }, []);

  const applyCropResult = useCallback(async (itemId, file) => {
    try {
      const { file: out, width, height, bytes } =
        await compressImageToMaxDimension(file);
      setImageItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          if (item.kind === "new") URL.revokeObjectURL(item.preview);
          return {
            kind: "new",
            id: newImageId(),
            file: out,
            preview: URL.createObjectURL(out),
            width,
            height,
            bytes,
          };
        })
      );
      setCropModal(null);
    } catch (err) {
      setErrorMessage(err?.message || "Could not process image");
    }
  }, []);

  const imageItemsRef = useRef(imageItems);
  imageItemsRef.current = imageItems;

  useEffect(() => {
    return () => {
      imageItemsRef.current.forEach((item) => {
        if (item.kind === "new") URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  /* ---------- Drag & drop ---------- */

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        void addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  /* ---------- Upload with progress ---------- */

  const uploadSingleFile = (file, progressKey) =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [progressKey]: pct }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } catch {
            reject(new Error(t.invalidUploadResponse));
          }
        } else {
          reject(new Error(xhrErrorDetail(xhr, t.uploadFailed)));
        }
      });

      xhr.addEventListener("error", () => reject(new Error(t.networkError)));
      xhr.send(formData);
    });

  const uploadCardVideoFile = (file) =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("video", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload/video");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setVideoUploadProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        setVideoUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } catch {
            reject(new Error(t.invalidUploadResponse));
          }
        } else {
          reject(new Error(xhrErrorDetail(xhr, t.uploadFailed)));
        }
      });

      xhr.addEventListener("error", () => {
        setVideoUploadProgress(null);
        reject(new Error(t.networkError));
      });
      xhr.send(formData);
    });

  const handleCardVideoFile = async (fileList) => {
    const file = Array.from(fileList).find((f) => f.type.startsWith("video/"));
    if (!file) return;
    const maxBytes = 80 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Video must be at most ${maxBytes / (1024 * 1024)} MB.`);
      return;
    }
    setErrorMessage("");
    try {
      setVideoUploadProgress(0);
      const url = await uploadCardVideoFile(file);
      if (url) setCardVideoUrl(url);
    } catch (err) {
      setErrorMessage(err?.message || t.uploadFailed);
    }
  };

  /* ---------- Submit ---------- */

  const toNonNegativeInt = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (isCreateMode && selectedExisting) {
      try {
        setIsSubmitting(true);
        const delta = toNonNegativeInt(addQuantity, 0);
        if (delta <= 0) {
          setErrorMessage("Quantity to add must be a positive number.");
          return;
        }
        await api.patch(
          `/api/products/${selectedExisting._id}/stock/increment`,
          { delta },
          { headers: getAdminAuthHeaders() }
        );
        onSuccess?.();
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t.failedSaveProduct;
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const totalImages = imageItems.length;
    if (mode === "create" && totalImages === 0) {
      setErrorMessage(t.pleaseUploadImage);
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress({});

      const uploadedById = new Map();
      for (const item of imageItems) {
        if (item.kind !== "new") continue;
        const url = await uploadSingleFile(item.file, item.id);
        if (url) uploadedById.set(item.id, url);
      }

      const images = imageItems
        .map((item) =>
          item.kind === "existing" ? item.url : uploadedById.get(item.id)
        )
        .filter(Boolean);

      const rawStock = stockInputRef.current?.value ?? stock;
      const parsedStock = toNonNegativeInt(rawStock, 0);

      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim(),
        priceUSD: Number(price),
        discountPriceUSD: discountPrice ? Number(discountPrice) : null,
        allowSeparatePurchase,
        bundleFullSetPriceUSD: bundleFullSetPrice ? Number(bundleFullSetPrice) : null,
        bundleTopPriceUSD: bundleTopPrice ? Number(bundleTopPrice) : null,
        bundleBottomPriceUSD: bundleBottomPrice ? Number(bundleBottomPrice) : null,
        category: category.trim(),
        sizes,
        colors,
        stock: parsedStock,
        featured,
        isBestSeller,
        isNewArrival,
        images,
        cardVideoUrl: cardVideoUrl.trim() || null,
        cardVideoAdjustments: {
          brightness: videoBrightness,
          contrast: videoContrast,
          saturation: videoSaturation,
        },
      };

      const requestConfig = { headers: getAdminAuthHeaders() };

      if (mode === "edit" && initialProduct?._id) {
        await api.put(
          `/api/products/${initialProduct._id}`,
          payload,
          requestConfig
        );
      } else {
        await api.post("/api/products", payload, requestConfig);
      }

      onSuccess?.();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t.failedSaveProduct;
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Render ---------- */

  const galleryItems = useMemo(
    () =>
      imageItems.map((item) => ({
        key: item.id,
        kind: item.kind,
        src: item.kind === "existing" ? item.url : item.preview,
        width: item.kind === "new" ? item.width : undefined,
        height: item.kind === "new" ? item.height : undefined,
        bytes: item.kind === "new" ? item.bytes : undefined,
      })),
    [imageItems]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-5">
        {/* ---- General Information ---- */}
        <SectionCard title={t.generalInfo}>
          <div className="space-y-4">
            {isCreateMode && matchCandidates.length > 0 && !selectedExistingId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  {t.existingProductFoundTitle}
                </p>
                <p className="mt-1 text-[13px] text-amber-900/80">
                  {t.existingProductFoundDescription}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {matchCandidates.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-[13px]"
                    >
                      <div className="flex flex-col text-black/80">
                        <span className="font-medium">
                          {p.name}
                          {p.code ? (
                            <span className="ml-2 font-mono text-[12px] text-black/45">
                              {p.code}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 text-[12px] text-black/60">
                          ₼{" "}
                          {p.discountPriceUSD != null
                            ? p.discountPriceUSD
                            : p.priceUSD}{" "}
                          · {t.stock.toLowerCase()}: {Number(p.stock ?? 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExistingId(p._id);
                          setAddQuantity(stock || "1");
                        }}
                        className="whitespace-nowrap rounded-full bg-amber-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-amber-600"
                      >
                        {t.addStockCta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isCreateMode && selectedExisting && (
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                      {t.addStockToExistingTitle}
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-black/80">
                      {selectedExisting.name}{" "}
                      {selectedExisting.code ? (
                        <span className="ml-2 font-mono text-[12px] font-medium text-black/45">
                          {selectedExisting.code}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[12px] text-black/45">
                      {t.stock}: {Number(selectedExisting.stock ?? 0)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExistingId("");
                      setAddQuantity("1");
                    }}
                    className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[12px] font-medium text-black/60 transition hover:bg-black/[0.04]"
                  >
                    {t.addStockCreateNewInstead}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <FieldLabel htmlFor="pf-add-qty" required>
                      {t.addStockQuantityLabel}
                    </FieldLabel>
                    <input
                      id="pf-add-qty"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="sami-input rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="sami-btn-dark flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-[12px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t.saving}
                      </>
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={2} />
                        {t.addStockCta}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="pf-code">{t.productCode}</FieldLabel>
                <input
                  id="pf-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setSelectedExistingId("");
                    setCode(e.target.value);
                  }}
                  placeholder={t.placeholderCode}
                  className="sami-input rounded-lg font-mono"
                />
              </div>

              <div>
                <FieldLabel htmlFor="pf-name" required>
                  {t.productName}
                </FieldLabel>
                <input
                  id="pf-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setSelectedExistingId("");
                    setName(e.target.value);
                  }}
                  placeholder={t.placeholderProductName}
                  className="sami-input rounded-lg"
                />
                {isCreateMode && isSearchingMatches && (
                  <p className="mt-1 text-[11px] text-black/40">Searching…</p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="pf-category" required>
                  {t.category}
                </FieldLabel>
                <input
                  id="pf-category"
                  type="text"
                  required
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={t.placeholderCategory}
                  className="sami-input rounded-lg"
                />
                {categories.length > 0 && (
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="pf-description" required>
                {t.description}
              </FieldLabel>
              <textarea
                id="pf-description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.placeholderDescription}
                className="sami-input resize-y rounded-lg"
              />
            </div>
          </div>
        </SectionCard>

        {/* ---- Pricing ---- */}
        <SectionCard title={t.pricingInventory}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="pf-price" required>
                {t.priceUSD}
              </FieldLabel>
              <div className="flex overflow-hidden rounded-lg border border-[var(--color-line)] transition-colors focus-within:border-[var(--color-gold)]">
                <span className="flex items-center border-r border-[var(--color-line)] bg-[var(--color-cream)]/70 px-3.5 text-[13px] font-medium text-black/40">
                  ₼
                </span>
                <input
                  id="pf-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-none bg-white px-3 py-3 text-[14px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="pf-discountPrice">{t.discountPrice}</FieldLabel>
              <div className="flex overflow-hidden rounded-lg border border-[var(--color-line)] transition-colors focus-within:border-[var(--color-gold)]">
                <span className="flex items-center border-r border-[var(--color-line)] bg-[var(--color-cream)]/70 px-3.5 text-[13px] font-medium text-black/40">
                  ₼
                </span>
                <input
                  id="pf-discountPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-none bg-white px-3 py-3 text-[14px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-cream)]/35 p-4">
            <div className="mb-3">
              <ToggleSwitch
                checked={allowSeparatePurchase}
                onChange={setAllowSeparatePurchase}
                label="Allow separate purchase (Top only / Bottom only)"
              />
              <p className="mt-1 text-[11px] text-black/45">
                Turn off to sell this product only as a full set.
              </p>
            </div>
            {allowSeparatePurchase && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel htmlFor="pf-bundle-full">Full set price (optional)</FieldLabel>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--color-line)] bg-white">
                    <span className="flex items-center border-r border-[var(--color-line)] px-3 text-[13px] text-black/40">
                      ₼
                    </span>
                    <input
                      id="pf-bundle-full"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bundleFullSetPrice}
                      onChange={(e) => setBundleFullSetPrice(e.target.value)}
                      placeholder="Auto"
                      className="w-full border-none px-3 py-2.5 text-[13px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="pf-bundle-top">Top only price (optional)</FieldLabel>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--color-line)] bg-white">
                    <span className="flex items-center border-r border-[var(--color-line)] px-3 text-[13px] text-black/40">
                      ₼
                    </span>
                    <input
                      id="pf-bundle-top"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bundleTopPrice}
                      onChange={(e) => setBundleTopPrice(e.target.value)}
                      placeholder="Auto"
                      className="w-full border-none px-3 py-2.5 text-[13px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="pf-bundle-bottom">Bottom only price (optional)</FieldLabel>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--color-line)] bg-white">
                    <span className="flex items-center border-r border-[var(--color-line)] px-3 text-[13px] text-black/40">
                      ₼
                    </span>
                    <input
                      id="pf-bundle-bottom"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bundleBottomPrice}
                      onChange={(e) => setBundleBottomPrice(e.target.value)}
                      placeholder="Auto"
                      className="w-full border-none px-3 py-2.5 text-[13px] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ---- Variants (collapsed by default) ---- */}
        <CollapsibleCard
          title={t.variants}
          defaultOpen={false}
          summaryRight={`${sizes.length} ${t.sizes} · ${colors.length} ${t.colors}`}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel>{t.sizes}</FieldLabel>
              <TagInput
                tags={sizes}
                setTags={setSizes}
                placeholder={t.placeholderSize}
                suggestions={SIZE_SUGGESTIONS}
              />
            </div>

            <div>
              <FieldLabel>{t.colors}</FieldLabel>
              <TagInput tags={colors} setTags={setColors} placeholder={t.placeholderColor} />
            </div>
          </div>
        </CollapsibleCard>

        {/* ---- Images: drag-drop manager ---- */}
        <CollapsibleCard
          title={t.productImages}
          defaultOpen
          summaryRight={
            galleryItems.length > 0
              ? `${t.nImages(galleryItems.length)} · ${t.firstImageIsCover}`
              : ""
          }
        >
          <p className="mb-4 text-[12px] leading-relaxed text-black/45">
            {t.imageCompressHint}
          </p>

          {galleryItems.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryItems.map((img, idx) => (
                <ProductImageCard
                  key={img.key}
                  itemId={img.key}
                  src={img.src}
                  metaNew={
                    img.kind === "new" &&
                    img.width != null &&
                    img.height != null &&
                    img.bytes != null
                      ? { w: img.width, h: img.height, bytes: img.bytes }
                      : null
                  }
                  isCover={idx === 0}
                  showCoverAction={idx !== 0}
                  progress={
                    img.kind === "new" && isSubmitting
                      ? uploadProgress[img.key] ?? 0
                      : undefined
                  }
                  onRemove={() => removeImage(img.key)}
                  onCrop={() => setCropModal({ id: img.key, src: img.src })}
                  onSetCover={() => setAsCover(img.key)}
                  onDragStart={handleThumbDragStart}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleThumbDrop(e, img.key)}
                  onPhotoClick={setLightboxSrc}
                />
              ))}
            </div>
          )}

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors sm:flex-row sm:justify-between sm:text-left ${
              isDragging
                ? "border-[#C8A96E] bg-[#C8A96E]/10"
                : "border-black/[0.12] bg-neutral-50 hover:border-[#C8A96E]/60 hover:bg-[#C8A96E]/[0.04]"
            }`}
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm"
                style={{
                  color: isDragging ? ACCENT_GOLD : "rgba(0,0,0,0.35)",
                }}
              >
                {isDragging ? (
                  <Upload size={26} strokeWidth={1.8} />
                ) : (
                  <ImageIcon size={26} strokeWidth={1.8} />
                )}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-black/70">
                  {isDragging ? t.dragImagesHere : t.bulkUploadHint}
                </p>
                <p className="mt-1 text-[12px] text-black/40">{t.dragOrClick}</p>
                <p className="mt-0.5 text-[11px] text-black/35">{t.imageFormats}</p>
              </div>
            </div>
            <span
              className="shrink-0 rounded-lg px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: ACCENT_GOLD }}
            >
              {t.add}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void addFiles(e.target.files);
              }
              e.target.value = "";
            }}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title={t.cardVideo}
          defaultOpen={false}
          summaryRight={cardVideoUrl ? t.cardVideoPreview : ""}
        >
          <p className="mb-4 text-[12px] leading-relaxed text-black/50">
            {t.cardVideoHint}
          </p>
          {cardVideoUrl ? (
            <div className="mb-4 max-w-sm overflow-hidden rounded-lg border border-[var(--color-line)] bg-black">
              <video
                src={cardVideoUrl}
                className="max-h-56 w-full object-contain"
                style={{
                  filter: `brightness(${videoBrightness}%) contrast(${videoContrast}%) saturate(${videoSaturation}%)`,
                }}
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
            </div>
          ) : null}
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                videoInputRef.current?.click();
              }
            }}
            onClick={() => videoInputRef.current?.click()}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-cream)]/50 px-4 py-4 transition-colors hover:border-[var(--color-gold)]/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-sand)]/60 text-black/30">
                {videoUploadProgress !== null ? (
                  <Loader2
                    size={20}
                    className="animate-spin text-[var(--color-gold)]"
                  />
                ) : (
                  <Video size={20} strokeWidth={1.8} />
                )}
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/60">
                  {videoUploadProgress !== null
                    ? `${t.cardVideoUploading} ${videoUploadProgress}%`
                    : cardVideoUrl
                      ? t.replaceCardVideo
                      : t.selectOrDropVideo}
                </p>
                <p className="mt-0.5 text-[11px] text-black/35">
                  {t.cardVideoFormats}
                </p>
              </div>
            </div>
            <span className="text-[12px] font-medium text-black/45">{t.add}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Brightness ({videoBrightness}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={videoBrightness}
                onChange={(e) => setVideoBrightness(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Contrast ({videoContrast}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={videoContrast}
                onChange={(e) => setVideoContrast(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-black/45">
                Saturation ({videoSaturation}%)
              </label>
              <input
                type="range"
                min={60}
                max={140}
                step={1}
                value={videoSaturation}
                onChange={(e) => setVideoSaturation(Number(e.target.value))}
                className="w-full accent-[var(--color-green)]"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setVideoBrightness(100);
                setVideoContrast(100);
                setVideoSaturation(100);
              }}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-black/60 transition hover:bg-black/[0.04] hover:text-black"
            >
              Reset Video Adjustments
            </button>
          </div>
          {cardVideoUrl ? (
            <button
              type="button"
              onClick={() => setCardVideoUrl("")}
              className="mt-3 text-[12px] font-medium text-red-600 transition hover:underline"
            >
              {t.removeCardVideo}
            </button>
          ) : null}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void handleCardVideoFile(e.target.files);
              }
              e.target.value = "";
            }}
          />
        </CollapsibleCard>
      </div>

      {/* Right rail (sticky): stock + visibility + save */}
      <div className="space-y-5 lg:sticky lg:top-6">
        <SectionCard title={t.stock}>
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="pf-stock" required>
                {t.stock}
              </FieldLabel>
              <input
                id="pf-stock"
                type="number"
                min="0"
                step="1"
                required
                ref={stockInputRef}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="sami-input rounded-lg text-[16px] font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 5, 10, 25].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStock(String(toNonNegativeInt(stock, 0) + n))}
                    className="rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-black/55 transition hover:bg-black/[0.04]"
                  >
                    +{n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStock("0")}
                  className="rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-black/55 transition hover:bg-black/[0.04]"
                >
                  {t.reset ?? "Reset"}
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t.visibility}>
          <div className="space-y-3">
            <ToggleSwitch checked={featured} onChange={setFeatured} label={t.featured} />
            <ToggleSwitch checked={isBestSeller} onChange={setIsBestSeller} label={t.bestSeller} />
            <ToggleSwitch checked={isNewArrival} onChange={setIsNewArrival} label={t.newArrival} />
          </div>
        </SectionCard>

        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle
              size={16}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-red-500"
            />
            <p className="text-[13px] leading-relaxed text-red-700">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="sami-btn-dark flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-[12px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {imageItems.some((i) => i.kind === "new")
                ? t.uploadingImages
                : t.saving}
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={2} />
              {submitLabel}
            </>
          )}
        </button>
      </div>

      {lightboxSrc ? (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      ) : null}

      {cropModal ? (
        <ImageCropModal
          imageSrc={cropModal.src}
          onClose={() => setCropModal(null)}
          onApply={async (file) => {
            await applyCropResult(cropModal.id, file);
          }}
        />
      ) : null}
    </form>
  );
}
