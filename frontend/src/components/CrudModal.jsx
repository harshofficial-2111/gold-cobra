import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function CrudModal({
  title,
  fields,
  initialValues = {},
  onClose,
  onSubmit,
  submitLabel = "Save",
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, initialValues[f.name] ?? ""])
    )
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep modal values in sync if the selected record changes.
  useEffect(() => {
    setValues(
      Object.fromEntries(
        fields.map((f) => [f.name, initialValues[f.name] ?? ""])
      )
    );
    setError("");
  }, [fields, initialValues]);

  // Allow Escape to close the modal.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    const missing = fields.find(
      (f) =>
        f.required &&
        (values[f.name] === undefined ||
          values[f.name] === null ||
          String(values[f.name]).trim() === "")
    );

    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }

    try {
      setSaving(true);
      await onSubmit(values);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateValue(name, value) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-end justify-center
        bg-black/40 p-0
        sm:items-center sm:p-4
      "
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="
          flex w-full min-w-0 max-w-md flex-col
          overflow-hidden rounded-t-2xl bg-white shadow-xl
          sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl
        "
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className="
            flex shrink-0 items-center justify-between gap-3
            border-b border-gray-200 px-4 py-3
            sm:px-5 sm:py-4
          "
        >
          <h2 className="min-w-0 truncate text-lg font-bold text-gray-800 sm:text-xl">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="
              inline-flex min-h-11 min-w-11 shrink-0
              items-center justify-center rounded-lg
              text-gray-500 transition
              hover:bg-gray-100 hover:text-gray-700
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        {/* Form */}
        <form
          onSubmit={submit}
          className="
            min-h-0 overflow-y-auto
            px-4 py-4
            sm:px-5 sm:py-5
          "
        >
          <div className="space-y-4">
            {fields.map((f) => (
              <label
                className="block text-sm font-medium text-gray-700"
                key={f.name}
              >
                <span>
                  {f.label}
                  {f.required && (
                    <span className="text-red-500"> *</span>
                  )}
                </span>

                {f.type === "select" ? (
                  <select
                    value={values[f.name]}
                    onChange={(e) =>
                      updateValue(f.name, e.target.value)
                    }
                    disabled={saving}
                    className="
                      mt-1.5 block min-h-11 w-full min-w-0
                      rounded-lg border border-gray-300 bg-white
                      px-3 text-base text-gray-800
                      outline-none transition
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      disabled:bg-gray-100 disabled:text-gray-500
                    "
                  >
                    <option value="">Select…</option>

                    {f.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    inputMode={f.type === "number" ? "decimal" : undefined}
                    step={f.type === "number" ? "any" : undefined}
                    value={values[f.name]}
                    onChange={(e) =>
                      updateValue(f.name, e.target.value)
                    }
                    disabled={saving}
                    className="
                      mt-1.5 block min-h-11 w-full min-w-0
                      rounded-lg border border-gray-300 bg-white
                      px-3 text-base text-gray-800
                      outline-none transition
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      disabled:bg-gray-100 disabled:text-gray-500
                    "
                  />
                )}
              </label>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="
                mt-4 rounded-lg bg-red-50
                px-3 py-2.5 text-sm leading-5 text-red-600
              "
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <footer
            className="
              mt-5 flex flex-col-reverse gap-2
              border-t border-gray-100 pt-4
              sm:flex-row sm:justify-end
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                inline-flex min-h-11 w-full items-center justify-center
                rounded-lg px-4 text-sm font-medium text-gray-700
                transition hover:bg-gray-100
                disabled:cursor-not-allowed disabled:opacity-50
                sm:w-auto
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex min-h-11 w-full items-center justify-center
                rounded-lg bg-blue-600 px-5
                text-sm font-semibold text-white
                transition hover:bg-blue-700
                disabled:cursor-not-allowed disabled:opacity-60
                sm:w-auto
              "
            >
              {saving ? "Saving…" : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}