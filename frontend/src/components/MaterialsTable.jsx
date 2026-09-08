import React, { useState } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";

import { materialApi } from "../api/client";
import CrudModal from "./CrudModal";

const FIELDS = [
  { name: "mixType", label: "Mix Type", type: "text", required: true },
  { name: "itemType", label: "Item Type", type: "text", required: true },
  { name: "quantity", label: "Quantity", type: "number", required: true },
  { name: "totalSum", label: "Total Sum", type: "number" },
];

export default function MaterialsTable({
  data = [],
  road,
  onChanged,
  canEdit = true,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  function openAdd() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    const payload = {
      mixType: values.mixType,
      itemType: values.itemType,
      quantity: values.quantity === "" ? null : Number(values.quantity),
      totalSum: values.totalSum === "" ? 0 : Number(values.totalSum),
    };

    if (editingItem) {
      await materialApi.update(editingItem.id, payload);
    } else {
      await materialApi.add({ road, ...payload });
    }

    setModalOpen(false);
    setEditingItem(null);
    onChanged && onChanged();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this material record?")) return;

    try {
      setDeletingId(id);
      await materialApi.remove(id);
      onChanged && onChanged();
    } catch (err) {
      console.error("Delete Material Error:", err);
      window.alert(
        err?.response?.data?.message || "Failed to delete material."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-3 shadow-md sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2">
          <Package
            className="shrink-0 text-blue-600"
            size={20}
            aria-hidden="true"
          />

          <h2 className="truncate text-lg font-bold text-gray-800 sm:text-xl">
            TM
          </h2>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            disabled={!road}
            className="
              inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5
              rounded-lg bg-blue-600 px-3 text-sm font-medium text-white
              transition hover:bg-blue-700
              disabled:cursor-not-allowed disabled:opacity-50
              sm:px-4
            "
          >
            <Plus size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Add Material</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {data.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center px-3 py-10 text-center text-sm text-gray-500 sm:text-base">
          No material records found.
        </div>
      ) : (
        <>
          {/* =========================================================
              MOBILE CARDS
              ========================================================= */}
          <div className="space-y-3 md:hidden">
            {data.map((item) => (
              <article
                key={item.id}
                className="gc-mobile-card w-full min-w-0"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-semibold text-gray-800"
                      title={`${item.mix_type} ${item.item_type}`}
                    >
                      {item.mix_type} {item.item_type}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.item_type}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-gray-700">
                      {item.value ?? "—"}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="
                        inline-flex min-h-11 items-center justify-center gap-1.5
                        rounded-lg px-3 text-sm font-medium text-blue-600
                        hover:bg-blue-50 hover:text-blue-800
                      "
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="
                        inline-flex min-h-11 items-center justify-center gap-1.5
                        rounded-lg px-3 text-sm font-medium text-red-600
                        hover:bg-red-50 hover:text-red-800
                        disabled:cursor-not-allowed disabled:opacity-50
                      "
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* =========================================================
              TABLET / DESKTOP TABLE
              ========================================================= */}
          <div className="hidden w-full min-w-0 md:block gc-table-scroll">
            <table className="w-full min-w-[620px] border border-gray-200 text-sm lg:text-base">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 text-left font-semibold sm:px-4">
                    Mix Type
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left font-semibold sm:px-4">
                    Item Type
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center font-semibold sm:px-4">
                    Quantity
                  </th>

                  {canEdit && (
                    <th className="whitespace-nowrap px-3 py-3 text-center font-semibold sm:px-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 transition hover:bg-gray-50"
                  >
                    <td
                      className="max-w-[220px] truncate px-3 py-4 font-medium text-gray-700 sm:px-4"
                      title={item.mix_type}
                    >
                      {item.mix_type}
                    </td>

                    <td
                      className="max-w-[260px] truncate px-3 py-4 sm:px-4"
                      title={item.item_type}
                    >
                      {item.item_type}
                    </td>

                    <td className="px-3 py-4 text-center font-mono sm:px-4">
                      {item.value ?? "—"}
                    </td>

                    {canEdit && (
                      <td className="px-3 py-4 sm:px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="
                              inline-flex min-h-11 min-w-11 items-center
                              justify-center rounded-lg text-blue-600
                              hover:bg-blue-50 hover:text-blue-800
                            "
                            title="Edit"
                            aria-label="Edit material"
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="
                              inline-flex min-h-11 min-w-11 items-center
                              justify-center rounded-lg text-red-600
                              hover:bg-red-50 hover:text-red-800
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                            title="Delete"
                            aria-label="Delete material"
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {canEdit && modalOpen && (
        <CrudModal
          title={editingItem ? "Edit Material" : "Add Material"}
          fields={FIELDS}
          initialValues={
            editingItem
              ? {
                  mixType: editingItem.mix_type,
                  itemType: editingItem.item_type,
                  quantity: editingItem.value,
                  totalSum: editingItem.total_sum ?? "",
                }
              : {}
          }
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Update" : "Add"}
        />
      )}
    </section>
  );
}