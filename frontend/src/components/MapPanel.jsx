import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

import { roadApi } from "../api/client";

const MAX_FILE_MB = 2;

export default function MapPanel({
  selectedWard,
  selectedRoad,
  imageUrl,
  onChanged,
  canEdit = false,
}) {
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(imageUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    setPreview(imageUrl || "");
  }, [imageUrl]);

  // Close fullscreen with Escape.
  useEffect(() => {
    if (!fullscreenOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setFullscreenOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreenOpen]);

  function openEditor() {
    setPreview(imageUrl || "");
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setPreview(imageUrl || "");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setEditing(false);
  }

  function handleFilePicked(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(
        `Image is too large. Please choose an image under ${MAX_FILE_MB}MB.`
      );
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result);
    };

    reader.onerror = () => {
      setError("We couldn't read that image. Please try another file.");
    };

    reader.readAsDataURL(file);
  }

  function removePreview() {
    setPreview("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!preview) {
      setError("Please choose a photo first.");
      return;
    }

    setError("");

    try {
      setSaving(true);

      await roadApi.setImage({
        road: selectedRoad,
        imageUrl: preview,
      });

      setEditing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "We couldn't save the photo. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function openFullscreen() {
    if (imageUrl) {
      setFullscreenOpen(true);
    }
  }

  function closeFullscreen() {
    setFullscreenOpen(false);
  }

  return (
    <>
      <section
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-sm
          transition-shadow
          hover:shadow-md
        "
      >
        {/* Header */}
        <div
          className="
            flex
            min-w-0
            items-center
            justify-between
            gap-3
            border-b
            border-gray-100
            px-4
            py-4
            sm:px-5
            sm:py-5
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-50
              "
            >
              <MapPin
                size={20}
                className="text-blue-600"
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                Road Location
              </h2>

              <p className="truncate text-xs text-gray-500 sm:text-sm">
                {selectedRoad || "No road selected"}
                {selectedWard ? ` · Ward ${selectedWard}` : ""}
              </p>
            </div>
          </div>

          {canEdit && selectedRoad && !editing && (
            <button
              type="button"
              onClick={openEditor}
              className="
                inline-flex
                min-h-10
                shrink-0
                items-center
                gap-2
                rounded-xl
                border
                border-blue-100
                bg-blue-50
                px-3
                text-sm
                font-semibold
                text-blue-700
                transition
                hover:border-blue-200
                hover:bg-blue-100
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:ring-offset-2
                active:scale-[0.98]
              "
            >
              <Pencil size={15} />

              <span className="hidden sm:inline">
                {imageUrl ? "Change Photo" : "Add Photo"}
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5">
          {/* =========================
              EDITOR
          ========================= */}
          {editing ? (
            <div className="space-y-4">
              {preview ? (
                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-100
                  "
                >
                  <img
                    src={preview}
                    alt="Selected road photo preview"
                    className="
                      mx-auto
                      max-h-[260px]
                      w-full
                      object-contain
                      sm:max-h-[360px]
                    "
                  />

                  <div
                    className="
                      absolute
                      inset-x-0
                      bottom-0
                      flex
                      items-center
                      justify-between
                      gap-2
                      bg-gradient-to-t
                      from-black/60
                      to-transparent
                      px-3
                      pb-3
                      pt-10
                    "
                  >
                    <span className="text-xs font-medium text-white">
                      Photo preview
                    </span>

                    <button
                      type="button"
                      onClick={removePreview}
                      className="
                        inline-flex
                        min-h-9
                        items-center
                        gap-1.5
                        rounded-lg
                        bg-white/90
                        px-2.5
                        text-xs
                        font-semibold
                        text-gray-700
                        backdrop-blur
                        transition
                        hover:bg-white
                        focus:outline-none
                        focus:ring-2
                        focus:ring-white
                      "
                    >
                      <RotateCcw size={14} />
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    group
                    flex
                    min-h-[280px]
                    w-full
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border-2
                    border-dashed
                    border-gray-300
                    bg-gray-50
                    px-5
                    text-center
                    transition
                    hover:border-blue-400
                    hover:bg-blue-50/50
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                    sm:min-h-[340px]
                  "
                >
                  <div
                    className="
                      mb-4
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-white
                      shadow-sm
                      ring-1
                      ring-gray-200
                      transition
                      group-hover:scale-105
                      group-hover:ring-blue-200
                    "
                  >
                    <ImagePlus
                      size={30}
                      className="text-blue-500"
                    />
                  </div>

                  <p className="text-sm font-semibold text-gray-800 sm:text-base">
                    Add a road photo
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 sm:text-sm">
                    Choose a clear photo from your device
                  </p>

                  <span className="mt-3 text-xs text-gray-400">
                    JPG, PNG, WEBP · Max {MAX_FILE_MB}MB
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePicked}
                className="hidden"
              />

              {preview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    flex
                    min-h-11
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-700
                    transition
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                  "
                >
                  <Upload size={16} />
                  Choose Different Photo
                </button>
              )}

              {error && (
                <div
                  role="alert"
                  className="
                    flex
                    items-start
                    gap-2.5
                    rounded-xl
                    border
                    border-red-100
                    bg-red-50
                    px-3
                    py-3
                    text-sm
                    leading-5
                    text-red-700
                  "
                >
                  <X
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{error}</span>
                </div>
              )}

              <div
                className="
                  flex
                  gap-2
                  border-t
                  border-gray-100
                  pt-4
                "
              >
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="
                    min-h-11
                    flex-1
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-600
                    transition
                    hover:bg-gray-50
                    focus:outline-none
                    focus:ring-2
                    focus:ring-gray-400
                    focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !preview}
                  className="
                    inline-flex
                    min-h-11
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Save Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : imageUrl ? (
            /* =========================
               IMAGE VIEW
            ========================= */
            <button
              type="button"
              onClick={openFullscreen}
              aria-label={`View ${selectedRoad || "road"} photo fullscreen`}
              className="
                group
                relative
                block
                h-[240px]
                w-full
                min-w-0
                cursor-zoom-in
                overflow-hidden
                rounded-2xl
                bg-gray-100
                text-left
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:ring-offset-2
                sm:h-[320px]
                md:h-[360px]
                lg:h-[400px]
              "
            >
              <img
                src={imageUrl}
                alt={selectedRoad || "Road location"}
                className="
                  h-full
                  w-full
                  object-cover
                  transition
                  duration-500
                  group-hover:scale-[1.02]
                "
              />

              {/* Top-right zoom control */}
              <div
                className="
                  absolute
                  right-3
                  top-3
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-black/40
                  text-white
                  opacity-90
                  backdrop-blur-sm
                  transition
                  group-hover:bg-black/60
                  sm:right-4
                  sm:top-4
                "
              >
                <ZoomIn size={18} />
              </div>

              {/* Bottom information */}
              <div
                className="
                  absolute
                  inset-x-0
                  bottom-0
                  bg-gradient-to-t
                  from-black/80
                  via-black/35
                  to-transparent
                  px-4
                  pb-4
                  pt-16
                  text-white
                  sm:px-5
                  sm:pb-5
                "
              >
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold sm:text-base">
                      {selectedRoad}
                    </p>

                    {selectedWard && (
                      <p className="mt-0.5 text-xs text-gray-200 sm:text-sm">
                        Ward {selectedWard}
                      </p>
                    )}
                  </div>

                  <span
                    className="
                      hidden
                      shrink-0
                      rounded-lg
                      bg-white/15
                      px-2.5
                      py-1.5
                      text-xs
                      font-medium
                      backdrop-blur
                      sm:inline-flex
                    "
                  >
                    Click to enlarge
                  </span>
                </div>
              </div>
            </button>
          ) : (
            /* =========================
               EMPTY STATE
            ========================= */
            <div
              className="
                flex
                min-h-[240px]
                w-full
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-gray-300
                bg-gradient-to-b
                from-gray-50
                to-white
                px-5
                py-8
                text-center
                sm:min-h-[320px]
                md:min-h-[360px]
              "
            >
              <div
                className="
                  mb-4
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  ring-8
                  ring-blue-50/50
                "
              >
                <Camera
                  size={30}
                  className="text-blue-400"
                />
              </div>

              <p className="max-w-full truncate px-3 text-base font-bold text-gray-800 sm:text-lg">
                {selectedRoad || "No road selected"}
              </p>

              {selectedWard && (
                <p className="mt-1 text-sm text-gray-500">
                  Ward {selectedWard}
                </p>
              )}

              <p className="mt-3 max-w-sm text-xs leading-5 text-gray-400 sm:text-sm">
                {canEdit
                  ? "There is no photo for this road yet. Add one to make the location easier to identify."
                  : "No photo is available for this road yet."}
              </p>

              {canEdit && selectedRoad && (
                <button
                  type="button"
                  onClick={openEditor}
                  className="
                    mt-5
                    inline-flex
                    min-h-11
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                    active:scale-[0.98]
                  "
                >
                  <ImagePlus size={17} />
                  Add Road Photo
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================
          FULLSCREEN IMAGE
      ========================= */}
      {fullscreenOpen &&
        imageUrl &&
        createPortal(
          <div
            className="
              fixed
              inset-0
              z-[9999]
              flex
              min-h-[100dvh]
              w-full
              items-center
              justify-center
              overflow-hidden
              bg-black/95
              p-3
              sm:p-6
            "
            role="dialog"
            aria-modal="true"
            aria-label="Road photo viewer"
            onClick={closeFullscreen}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeFullscreen}
              aria-label="Close image viewer"
              className="
                absolute
                right-3
                top-3
                z-20
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-white/10
                text-white
                backdrop-blur-sm
                transition
                hover:bg-white/20
                focus:outline-none
                focus:ring-2
                focus:ring-white
                active:scale-95
                sm:right-5
                sm:top-5
              "
            >
              <X size={23} />
            </button>

            {/* Image */}
            <img
              src={imageUrl}
              alt={selectedRoad || "Road location"}
              className="
                max-h-[calc(100dvh-120px)]
                max-w-full
                rounded-lg
                object-contain
                shadow-2xl
                sm:max-h-[calc(100dvh-130px)]
              "
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption */}
            <div
              className="
                absolute
                inset-x-0
                bottom-0
                bg-gradient-to-t
                from-black/80
                to-transparent
                px-4
                pb-5
                pt-14
                text-center
                text-white
                sm:pb-6
              "
              onClick={(e) => e.stopPropagation()}
            >
              <p className="truncate text-base font-bold sm:text-lg">
                {selectedRoad || "Road location"}
              </p>

              {selectedWard && (
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Ward {selectedWard}
                </p>
              )}

              <p className="mt-2 text-[11px] text-gray-400">
                Press Esc or tap outside to close
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
