import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Pencil, Upload, X } from "lucide-react";

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

  function openEditor() {
    setPreview(imageUrl || "");
    setError("");
    setEditing(true);
  }

  function handleFilePicked(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(
        `Image is too large — please pick one under ${MAX_FILE_MB}MB.`
      );
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result);
    };

    reader.onerror = () => {
      setError("Could not read that file.");
    };

    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!preview) {
      setError("Choose a photo first.");
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

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to save image."
      );
    } finally {
      setSaving(false);
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
          rounded-xl
          bg-white
          p-3
          shadow-md
          sm:p-4
          md:p-6
          lg:col-span-2
        "
      >
        {/* =========================
            HEADER
        ========================= */}
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin
              className="shrink-0 text-blue-600"
              size={20}
            />

            <h2 className="truncate text-lg font-bold text-gray-800 sm:text-xl">
              Location
            </h2>
          </div>

          {canEdit && selectedRoad && !editing && (
            <button
              type="button"
              onClick={openEditor}
              className="
                flex
                min-h-11
                shrink-0
                items-center
                gap-1.5
                rounded-lg
                px-2
                text-sm
                font-medium
                text-blue-600
                transition
                hover:bg-blue-50
                hover:text-blue-800
                sm:px-3
              "
            >
              <Pencil size={15} />

              <span className="hidden xs:inline sm:inline">
                {imageUrl ? "Change Photo" : "Add Photo"}
              </span>
            </button>
          )}
        </div>

        {/* =========================
            EDIT PHOTO
        ========================= */}
        {editing ? (
          <div
            className="
              flex
              min-h-[240px]
              w-full
              flex-col
              items-center
              justify-center
              gap-4
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              px-3
              py-5
              text-center
              sm:min-h-[300px]
              sm:px-6
            "
          >
            {preview ? (
              <div className="w-full max-w-md overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="
                    mx-auto
                    max-h-[180px]
                    w-auto
                    max-w-full
                    object-contain
                    sm:max-h-[220px]
                  "
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Upload
                  className="text-gray-300"
                  size={32}
                />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFilePicked}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                min-h-11
                w-full
                max-w-sm
                rounded-lg
                border
                border-blue-600
                px-4
                py-2.5
                text-sm
                font-medium
                text-blue-600
                transition
                hover:bg-blue-50
                active:scale-[0.99]
              "
            >
              Choose Photo From Device
            </button>

            {error && (
              <p
                role="alert"
                className="
                  w-full
                  max-w-sm
                  rounded-lg
                  bg-red-50
                  px-3
                  py-2
                  text-sm
                  leading-5
                  text-red-600
                "
              >
                {error}
              </p>
            )}

            <div className="flex w-full max-w-sm gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                className="
                  min-h-11
                  flex-1
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-600
                  transition
                  hover:bg-gray-100
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !preview}
                className="
                  min-h-11
                  flex-1
                  rounded-lg
                  bg-blue-600
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-blue-700
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : imageUrl ? (
          /* =========================
             IMAGE
          ========================= */
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className="
              group
              relative
              block
              h-[240px]
              w-full
              min-w-0
              overflow-hidden
              rounded-xl
              bg-gray-100
              text-left
              cursor-zoom-in
              sm:h-[300px]
              md:h-[340px]
              lg:h-[380px]
            "
          >
            <img
              src={imageUrl}
              alt={selectedRoad}
              className="
                h-full
                w-full
                object-cover
                transition
                duration-200
                group-hover:opacity-90
              "
            />

            {/* Image information */}
            <div
              className="
                absolute
                inset-x-0
                bottom-0
                bg-gradient-to-t
                from-black/70
                to-transparent
                px-3
                pb-3
                pt-8
                text-white
                sm:px-4
              "
            >
              <p className="truncate text-sm font-semibold sm:text-base">
                {selectedRoad}
              </p>

              <p className="text-xs text-gray-200 sm:text-sm">
                Ward {selectedWard}
              </p>
            </div>
          </button>
        ) : (
          /* =========================
             NO IMAGE
          ========================= */
          <div
            className="
              flex
              min-h-[240px]
              w-full
              flex-col
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              border
              border-dashed
              border-gray-300
              bg-gray-100
              px-4
              py-6
              text-center
              sm:min-h-[300px]
              md:min-h-[340px]
            "
          >
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white">
              <MapPin
                className="text-gray-300"
                size={32}
              />
            </div>

            <p className="max-w-full truncate px-2 font-semibold text-gray-600">
              {selectedRoad || "No road selected"}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {selectedWard
                ? `Ward ${selectedWard}`
                : ""}
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
              {canEdit
                ? 'No photo yet — click "Add Photo" above to upload one from your device.'
                : "No photo available for this road yet."}
            </p>
          </div>
        )}
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
            onClick={closeFullscreen}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeFullscreen}
              aria-label="Close image"
              className="
                absolute
                right-3
                top-3
                z-10
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-white/10
                text-white
                transition
                hover:bg-white/20
                active:scale-95
                sm:right-5
                sm:top-5
              "
            >
              <X size={24} />
            </button>

            {/* Image */}
            <img
              src={imageUrl}
              alt={selectedRoad}
              className="
                max-h-[calc(100dvh-110px)]
                max-w-full
                object-contain
                rounded-lg
                sm:max-h-[calc(100dvh-120px)]
              "
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption */}
            <div
              className="
                absolute
                inset-x-0
                bottom-4
                px-4
                text-center
                text-white
                sm:bottom-6
              "
            >
              <p className="truncate text-base font-semibold sm:text-lg">
                {selectedRoad}
              </p>

              <p className="text-xs text-gray-300 sm:text-sm">
                Ward {selectedWard}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}