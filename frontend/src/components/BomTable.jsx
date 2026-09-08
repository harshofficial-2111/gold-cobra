import React, { useState } from "react";
import { HardHat, Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { bomApi } from "../api/client";
import CrudModal from "./CrudModal";

const STATUS_OPTIONS = ["Problem", "Good"];

const FIELDS = [
  { name: "item", label: "Item", type: "text", required: true },
  { name: "type", label: "Category", type: "text" },
  {
    name: "specs",
    label: "Technical Specifications",
    type: "text",
  },
  {
    name: "qty",
    label: "Quantity",
    type: "number",
    required: true,
  },
  { name: "unit", label: "Unit", type: "text" },
  { name: "unitRate", label: "Unit Rate", type: "number" },
  {
    name: "totalCost",
    label: "Total Cost (auto)",
    type: "number",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: STATUS_OPTIONS,
  },
];

const MAX_PLATE_LENGTH = 5000;

function normaliseNumberPlates(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((plate) => normaliseNumberPlates(plate))
      .filter(Boolean);
  }

  const raw = String(value ?? "").trim();

  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return normaliseNumberPlates(parsed);
      }
    } catch {
      // Continue with normal text parsing.
    }
  }

  return raw
    .split(/[\n,;|]+/)
    .map((plate) => plate.trim().toUpperCase())
    .filter(Boolean);
}

function getLogNumberPlates(log) {
  const values = [
    log?.numberPlate,
    log?.number_plate,
    log?.number_plates,
    log?.numberPlateList,
    log?.number_plate_list,
    log?.plates,
    log?.plateNumbers,
  ];

  return values
    .filter((value) => value !== undefined && value !== null && value !== "")
    .flatMap((value) => normaliseNumberPlates(value));
}

export default function BomTable({
  data = [],
  road,
  onChanged,
  canEdit = true,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    count: "1",
    quantity: "",
    unitRate: "",
    numberPlate: "",
  });

  function openAdd() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem({
      ...item,
      unitRate: item.unit_rate,
      totalCost: item.total_cost,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    const qty =
      values.qty === "" ? 0 : Number(values.qty);

    const unitRate =
      values.unitRate === ""
        ? 0
        : Number(values.unitRate);

    const computedTotal =
      unitRate > 0
        ? qty * unitRate
        : values.totalCost === ""
        ? 0
        : Number(values.totalCost);

    const payload = {
      item: values.item,
      type: values.type,
      specs: values.specs,
      qty: values.qty === "" ? null : qty,
      unit: values.unit,
      unitRate,
      totalCost: computedTotal,
      status: values.status,
    };

    try {
      if (editingItem) {
        await bomApi.update(
          editingItem.id,
          payload
        );
      } else {
        await bomApi.add({
          road,
          ...payload,
        });
      }

      setModalOpen(false);
      setEditingItem(null);

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      console.error("Save BOM Error:", err);

      window.alert(
        err?.response?.data?.message ||
          "Failed to save BOM item."
      );
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this BOM item?")) {
      return;
    }

    try {
      setDeletingId(id);

      await bomApi.remove(id);

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      console.error("Delete BOM Error:", err);

      window.alert(
        err?.response?.data?.message ||
          "Failed to delete item."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function openLogModal(item) {
    setSelectedItem(item);

    setFormData({
      date: "",
      count: "1",
      quantity: "",
      unitRate: item.unit_rate || "",
      numberPlate: "",
    });

    setLogs([]);
    setLogModalOpen(true);
    setLoadingLogs(true);

    try {
      const res = await bomApi.getById(item.id);

      if (res.data?.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(
        "Failed to load detailed logs:",
        err
      );
    } finally {
      setLoadingLogs(false);
    }
  }

  function closeLogModal() {
    setLogModalOpen(false);
    setSelectedItem(null);
    setLogs([]);
  }

  function updateFormData(key, value) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleAddLogEntry(e) {
    e.preventDefault();

    if (!selectedItem) {
      return;
    }

    const numberPlates = normaliseNumberPlates(
      formData.numberPlate
    );

    try {
      const payload = {
        date: formData.date,

        count:
          numberPlates.length ||
          (formData.count === ""
            ? 1
            : Number(formData.count)),

        qty: Number(formData.quantity),

        unitRate: formData.unitRate
          ? Number(formData.unitRate)
          : selectedItem.unit_rate || 0,

        numberPlate:
          numberPlates.length > 0
            ? numberPlates.join(", ")
            : null,
      };

      const res = await bomApi.addLog(
        selectedItem.id,
        payload
      );

      if (res.data?.success) {
        setLogs((prev) => [
          res.data.log,
          ...prev,
        ]);

        setFormData({
          date: "",
          count: "1",
          quantity: "",
          unitRate:
            selectedItem.unit_rate || "",
          numberPlate: "",
        });

        if (onChanged) {
          onChanged();
        }
      } else {
        window.alert(
          res.data?.message ||
            "Failed to add log entry."
        );
      }
    } catch (err) {
      console.error(
        "Failed to save log entry:",
        err
      );

      window.alert(
        err?.response?.data?.message ||
          "Failed to save log entry."
      );
    }
  }

  async function handleDeleteLogEntry(logId) {
    if (
      !window.confirm(
        "Delete this log entry?"
      )
    ) {
      return;
    }

    try {
      const res =
        await bomApi.deleteLog(logId);

      if (res.data?.success) {
        setLogs((prev) =>
          prev.filter(
            (log) => log.id !== logId
          )
        );

        if (onChanged) {
          onChanged();
        }
      } else {
        window.alert(
          res.data?.message ||
            "Failed to delete log entry."
        );
      }
    } catch (err) {
      console.error(
        "Failed to delete log entry:",
        err
      );

      window.alert(
        err?.response?.data?.message ||
          "Failed to delete log entry."
      );
    }
  }

  const previewCount =
    formData.count === ""
      ? 1
      : Number(formData.count) || 0;

  const previewQty =
    Number(formData.quantity) || 0;

  const previewRate = formData.unitRate
    ? Number(formData.unitRate)
    : selectedItem?.unit_rate || 0;

  const previewCost =
    previewCount *
    previewQty *
    previewRate;

  const totalLogQty = logs.reduce(
    (acc, curr) => {
      return (
        acc +
        Number(curr.qty || 0) *
          Number(curr.count || 1)
      );
    },
    0
  );

  // Fixed: no invalid mixing of ?? and ||.
  const totalLogCost = logs.reduce(
    (acc, curr) => {
      const fallbackCost =
        Number(curr.qty || 0) *
        Number(curr.unitRate || 0) *
        Number(curr.count || 1);

      const cost =
        curr.totalCost != null
          ? Number(curr.totalCost)
          : fallbackCost;

      return (
        acc +
        (Number.isFinite(cost) ? cost : 0)
      );
    },
    0
  );

  return (
    <section
      className="
        w-full min-w-0 overflow-hidden
        rounded-xl bg-white shadow-md
        p-3 sm:p-4 md:p-6
        lg:col-span-2
      "
    >
      {/* HEADER */}
      <div
        className="
          mb-4 flex min-w-0 items-center
          justify-between gap-3
          sm:mb-6
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <HardHat
            className="shrink-0 text-blue-600"
            size={22}
          />

          <h2
            className="
              truncate text-lg font-bold
              text-gray-800 sm:text-xl
            "
          >
            Bill of Materials
          </h2>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            disabled={!road}
            className="
              inline-flex min-h-11 shrink-0
              items-center justify-center
              gap-1.5 rounded-lg
              bg-blue-600 px-3
              text-sm font-medium text-white
              transition hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:px-4
            "
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Add Item
            </span>

            <span className="sm:hidden">
              Add
            </span>
          </button>
        )}
      </div>

      {/* EMPTY */}
      {data.length === 0 ? (
        <div
          className="
            flex min-h-[180px]
            items-center justify-center
            px-3 py-10 text-center
            text-sm text-gray-500
            sm:text-base
          "
        >
          No material records found.
        </div>
      ) : (
        <>
          {/* MOBILE CARDS */}
          <div className="space-y-3 md:hidden">
            {data.map((item) => (
              <article
                key={item.id}
                className="
                  w-full min-w-0
                  rounded-xl border
                  border-gray-200
                  bg-white p-3 shadow-sm
                "
              >
                <div
                  className="
                    flex min-w-0
                    items-start
                    justify-between
                    gap-3
                  "
                >
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        openLogModal(item)
                      }
                      className="
                        block max-w-full
                        truncate text-left
                        font-semibold
                        text-blue-600
                        hover:text-blue-800
                        hover:underline
                      "
                      title={item.item}
                    >
                      {item.item}
                    </button>

                    <p
                      className="
                        mt-1 truncate
                        text-xs text-gray-500
                      "
                    >
                      {item.type ||
                        "No category"}
                    </p>
                  </div>

                  <span
                    className={`
                      shrink-0 rounded-full
                      px-2.5 py-1
                      text-xs font-medium
                      ${
                        item.status === "Good"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }
                    `}
                  >
                    {item.status || "—"}
                  </span>
                </div>

                <div
                  className="
                    mt-3 grid
                    grid-cols-2 gap-2
                  "
                >
                  <div
                    className="
                      rounded-lg
                      bg-gray-50 p-2.5
                    "
                  >
                    <p className="text-[11px] text-gray-500">
                      Quantity
                    </p>

                    <p
                      className="
                        mt-0.5 truncate
                        text-sm font-semibold
                        text-gray-800
                      "
                    >
                      {item.qty ?? "—"}{" "}
                      {item.unit || ""}
                    </p>
                  </div>

                  <div
                    className="
                      rounded-lg
                      bg-gray-50 p-2.5
                    "
                  >
                    <p className="text-[11px] text-gray-500">
                      Total Cost
                    </p>

                    <p
                      className="
                        mt-0.5 truncate
                        text-sm font-semibold
                        text-gray-800
                      "
                    >
                      ₹
                      {Number(
                        item.total_cost || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {item.specs && (
                  <div
                    className="
                      mt-3 border-t
                      border-gray-200 pt-3
                    "
                  >
                    <p
                      className="
                        text-[11px]
                        font-medium
                        text-gray-500
                      "
                    >
                      Specifications
                    </p>

                    <p
                      className="
                        mt-1 line-clamp-2
                        break-words
                        text-xs text-gray-600
                      "
                    >
                      {item.specs}
                    </p>
                  </div>
                )}

                <div
                  className="
                    mt-3 flex flex-wrap
                    items-center
                    justify-between gap-2
                    border-t
                    border-gray-200 pt-3
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      openLogModal(item)
                    }
                    className="
                      inline-flex min-h-11
                      items-center
                      justify-center
                      gap-1.5 rounded-lg
                      px-2.5 text-sm
                      font-medium text-blue-600
                      hover:bg-blue-50
                    "
                  >
                    <Eye size={16} />
                    View Logs
                  </button>

                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(item)
                        }
                        className="
                          inline-flex
                          min-h-11 min-w-11
                          items-center
                          justify-center
                          rounded-lg
                          text-blue-600
                          hover:bg-blue-50
                        "
                        aria-label="Edit BOM item"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            item.id
                          )
                        }
                        disabled={
                          deletingId ===
                          item.id
                        }
                        className="
                          inline-flex
                          min-h-11 min-w-11
                          items-center
                          justify-center
                          rounded-lg
                          text-red-600
                          hover:bg-red-50
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                        aria-label="Delete BOM item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* TABLET / DESKTOP */}
          <div
            className="
              hidden w-full min-w-0
              md:block gc-table-scroll
            "
          >
            <table
              className="
                w-full min-w-[1000px]
                border border-gray-200
                text-sm lg:text-base
              "
            >
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                    Item
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                    Category
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left sm:px-4">
                    Specifications
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                    Quantity
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                    Unit
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                    Unit Rate
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                    Total Cost
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center sm:px-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="
                      border-b border-gray-200
                      transition hover:bg-gray-50
                    "
                  >
                    <td
                      className="
                        max-w-[220px]
                        px-3 py-4
                        font-semibold
                        text-blue-600
                        sm:px-4
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openLogModal(item)
                        }
                        className="
                          block max-w-full
                          truncate text-left
                          hover:underline
                        "
                        title={item.item}
                      >
                        {item.item}
                      </button>
                    </td>

                    <td
                      className="
                        max-w-[160px]
                        truncate px-3 py-4
                        text-gray-700 sm:px-4
                      "
                    >
                      {item.type || "—"}
                    </td>

                    <td
                      className="
                        max-w-[260px]
                        truncate px-3 py-4
                        text-sm text-gray-500
                        sm:px-4
                      "
                      title={item.specs}
                    >
                      {item.specs || "—"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center sm:px-4">
                      {item.qty ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center sm:px-4">
                      {item.unit || "—"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center sm:px-4">
                      ₹
                      {Number(
                        item.unit_rate ||
                          item.unitRate ||
                          0
                      ).toLocaleString()}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        px-3 py-4
                        text-center
                        font-semibold
                        sm:px-4
                      "
                    >
                      ₹
                      {Number(
                        item.total_cost || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-3 py-4 sm:px-4">
                      <div
                        className="
                          flex items-center
                          justify-center gap-1
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openLogModal(item)
                          }
                          className="
                            inline-flex
                            min-h-11 min-w-11
                            items-center
                            justify-center
                            rounded-lg
                            text-blue-600
                            hover:bg-blue-50
                          "
                          title="View Logs"
                          aria-label="View logs"
                        >
                          <Eye size={17} />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(item)
                              }
                              className="
                                inline-flex
                                min-h-11 min-w-11
                                items-center
                                justify-center
                                rounded-lg
                                text-blue-600
                                hover:bg-blue-50
                              "
                              title="Edit"
                              aria-label="Edit BOM item"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              disabled={
                                deletingId ===
                                item.id
                              }
                              className="
                                inline-flex
                                min-h-11 min-w-11
                                items-center
                                justify-center
                                rounded-lg
                                text-red-600
                                hover:bg-red-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                              title="Delete"
                              aria-label="Delete BOM item"
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ADD / EDIT BOM */}
      {canEdit && modalOpen && (
        <CrudModal
          title={
            editingItem
              ? "Edit BOM Item"
              : "Add BOM Item"
          }
          fields={FIELDS}
          initialValues={editingItem || {}}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleSubmit}
          submitLabel={
            editingItem ? "Update" : "Add"
          }
        />
      )}

      {/* DETAILED LOG MODAL */}
      {logModalOpen && selectedItem && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-end
            justify-center
            bg-black/60
            p-0
            sm:items-center
            sm:p-4
          "
          role="presentation"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeLogModal();
            }
          }}
        >
          <div
            className="
              flex w-full min-w-0
              max-h-[100dvh]
              flex-col
              overflow-hidden
              rounded-t-2xl
              bg-white
              shadow-2xl
              sm:max-w-5xl
              sm:rounded-2xl
              sm:max-h-[calc(100dvh-2rem)]
            "
            role="dialog"
            aria-modal="true"
            aria-label={`Detailed log for ${selectedItem.item}`}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            {/* LOG HEADER */}
            <div
              className="
                flex shrink-0
                items-start
                justify-between
                gap-3
                bg-blue-600
                px-4 py-4
                text-white
                sm:px-5 sm:py-5
              "
            >
              <div className="min-w-0 flex-1">
                <h3
                  className="
                    truncate
                    text-lg font-bold
                    sm:text-xl
                  "
                >
                  {selectedItem.item}
                </h3>

                <p
                  className="
                    mt-1 truncate
                    text-xs
                    text-blue-100
                    sm:text-sm
                  "
                >
                  Detailed Log Record
                </p>

                <p
                  className="
                    mt-1 break-words
                    text-xs text-blue-100
                  "
                >
                  Category:{" "}
                  {selectedItem.type ||
                    "N/A"}{" "}
                  | Unit:{" "}
                  {selectedItem.unit ||
                    "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLogModal}
                className="
                  inline-flex
                  min-h-11 min-w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-white/90
                  transition
                  hover:bg-blue-700
                  hover:text-white
                "
                aria-label="Close detailed log"
              >
                <X size={22} />
              </button>
            </div>

            {/* LOG BODY */}
            <div
              className="
                min-h-0 flex-1
                overflow-y-auto
                px-3 py-4
                sm:px-5 sm:py-5
              "
            >
              {/* ADD DAILY LOG */}
              {canEdit && (
                <form
                  onSubmit={handleAddLogEntry}
                  className="
                    rounded-xl
                    border border-gray-200
                    bg-gray-50
                    p-3 sm:p-4
                  "
                >
                  <h4
                    className="
                      mb-3
                      text-sm font-semibold
                      text-gray-800
                      sm:text-base
                    "
                  >
                    Add Daily Log
                  </h4>

                  <div
                    className="
                      grid grid-cols-1
                      gap-3
                      sm:grid-cols-2
                      lg:grid-cols-3
                    "
                  >
                    {/* DATE */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Date
                      </label>

                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          updateFormData(
                            "date",
                            e.target.value
                          )
                        }
                        className="
                          mt-1.5
                          min-h-11
                          w-full min-w-0
                          rounded-lg
                          border
                          border-gray-300
                          bg-white
                          px-3
                          text-base
                          outline-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                        "
                      />
                    </div>

                    {/* COUNT */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        No. of{" "}
                        {selectedItem.item}
                      </label>

                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="e.g. 3"
                        value={formData.count}
                        onChange={(e) =>
                          updateFormData(
                            "count",
                            e.target.value
                          )
                        }
                        className="
                          mt-1.5
                          min-h-11
                          w-full min-w-0
                          rounded-lg
                          border
                          border-gray-300
                          bg-white
                          px-3
                          text-base
                          outline-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                        "
                      />
                    </div>

                    {/* NUMBER PLATES */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-xs font-semibold text-gray-600">
                          Number Plates
                        </label>

                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                          {normaliseNumberPlates(formData.numberPlate).length}{" "}
                          {normaliseNumberPlates(formData.numberPlate).length === 1
                            ? "plate"
                            : "plates"}
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        maxLength={MAX_PLATE_LENGTH}
                        placeholder={`GJ-05-AB-1234
GJ-11-EA-5351`}
                        value={formData.numberPlate}
                        onChange={(e) => {
                          const numberPlate = e.target.value;
                          const numberPlates =
                            normaliseNumberPlates(numberPlate);

                          setFormData((prev) => ({
                            ...prev,
                            numberPlate,
                            count: numberPlates.length
                              ? String(numberPlates.length)
                              : prev.count,
                          }));
                        }}
                        className="
                          mt-1.5 block min-h-[76px] w-full min-w-0
                          resize-y rounded-lg border border-gray-300
                          bg-white px-3 py-2 text-base uppercase
                          outline-none placeholder:normal-case
                          focus:border-blue-500
                          focus:ring-2 focus:ring-blue-100
                        "
                      />

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-gray-500">
                          One plate per line or separate with commas.
                        </p>

                        <span className="shrink-0 text-[11px] text-gray-400">
                          {formData.numberPlate.length}/{MAX_PLATE_LENGTH}
                        </span>
                      </div>
                    </div>

                    {/* QUANTITY */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Quantity (
                        {selectedItem.unit ||
                          "units"}
                        )
                      </label>

                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="e.g. 10"
                        value={
                          formData.quantity
                        }
                        onChange={(e) =>
                          updateFormData(
                            "quantity",
                            e.target.value
                          )
                        }
                        className="
                          mt-1.5
                          min-h-11
                          w-full min-w-0
                          rounded-lg
                          border
                          border-gray-300
                          bg-white
                          px-3
                          text-base
                          outline-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                        "
                      />
                    </div>

                    {/* UNIT RATE */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Unit Rate (₹)
                      </label>

                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder={
                          selectedItem.unit_rate ||
                          "0"
                        }
                        value={
                          formData.unitRate
                        }
                        onChange={(e) =>
                          updateFormData(
                            "unitRate",
                            e.target.value
                          )
                        }
                        className="
                          mt-1.5
                          min-h-11
                          w-full min-w-0
                          rounded-lg
                          border
                          border-gray-300
                          bg-white
                          px-3
                          text-base
                          outline-none
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100
                        "
                      />
                    </div>

                    {/* ADD ENTRY */}
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="
                          inline-flex
                          min-h-11
                          w-full
                          items-center
                          justify-center
                          rounded-lg
                          bg-blue-600
                          px-4
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-blue-700
                        "
                      >
                        Add Entry
                      </button>
                    </div>
                  </div>

                  {/* COST PREVIEW */}
                  <div
                    className="
                      mt-3
                      rounded-lg
                      border border-blue-100
                      bg-white
                      px-3 py-2.5
                    "
                  >
                    <p
                      className="
                        break-words
                        text-xs
                        text-gray-500
                        sm:text-sm
                      "
                    >
                      {previewCount} ×{" "}
                      {previewQty}{" "}
                      {selectedItem.unit ||
                        ""}{" "}
                      × ₹
                      {previewRate.toLocaleString()}{" "}
                      =
                      <strong className="ml-1 text-gray-800">
                        ₹
                        {previewCost.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </form>
              )}

              {/* LOG TABLE */}
              <div
                className="
                  mt-4
                  w-full min-w-0
                  overflow-hidden
                  rounded-xl
                  border border-gray-200
                  sm:mt-6
                "
              >
                <div
                  className="
                    gc-table-scroll
                    max-h-[360px]
                    sm:max-h-[400px]
                  "
                >
                  <table
                    className="
                      w-full
                      min-w-[900px]
                      border-collapse
                      text-sm
                    "
                  >
                    <thead
                      className="
                        sticky top-0 z-10
                        bg-gray-100
                      "
                    >
                      <tr
                        className="
                          border-b
                          border-gray-200
                        "
                      >
                        <th className="whitespace-nowrap p-3 text-center">
                          Sr No
                        </th>

                        <th className="whitespace-nowrap p-3 text-left">
                          Date
                        </th>

                        <th className="whitespace-nowrap p-3 text-left">
                          Item
                        </th>

                        <th className="whitespace-nowrap p-3 text-center">
                          No. of Units
                        </th>

                        <th className="whitespace-nowrap p-3 text-left">
                          Number Plate
                        </th>

                        <th className="whitespace-nowrap p-3 text-center">
                          Quantity (
                          {selectedItem.unit ||
                            "units"}
                          )
                        </th>

                        <th className="whitespace-nowrap p-3 text-center">
                          Unit Rate
                        </th>

                        <th className="whitespace-nowrap p-3 text-center">
                          Total Cost
                        </th>

                        {canEdit && (
                          <th className="whitespace-nowrap p-3 text-center">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {loadingLogs ? (
                        <tr>
                          <td
                            colSpan={
                              canEdit ? 9 : 8
                            }
                            className="
                              py-8
                              text-center
                              text-gray-500
                            "
                          >
                            Loading logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={
                              canEdit ? 9 : 8
                            }
                            className="
                              py-8
                              text-center
                              text-gray-400
                            "
                          >
                            No daily log records
                            added yet.
                          </td>
                        </tr>
                      ) : (
                        logs.map(
                          (log, index) => {
                            const count =
                              Number(
                                log.count || 1
                              );

                            const cost =
                              log.totalCost ??
                              Number(
                                log.qty || 0
                              ) *
                                Number(
                                  log.unitRate ||
                                    0
                                ) *
                                count;

                            return (
                              <tr
                                key={
                                  log.id ||
                                  index
                                }
                                className="hover:bg-gray-50"
                              >
                                <td className="min-w-[320px] p-3 align-top">
                                  {(() => {
                                    const plates = getLogNumberPlates(log);

                                    if (plates.length === 0) {
                                      return (
                                        <span className="text-sm text-gray-400">
                                          No plates
                                        </span>
                                      );
                                    }

                                    return (
                                      <div className="min-w-0">
                                        <div className="mb-2 flex items-center gap-2">
                                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                                            {plates.length}
                                          </span>
                                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            Number Plates
                                          </span>
                                        </div>

                                        <div className="flex max-w-[700px] flex-wrap gap-1.5">
                                          {plates.map((plate, plateIndex) => (
                                            <span
                                              key={`${plate}-${plateIndex}`}
                                              className="inline-flex min-h-8 items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-blue-700 whitespace-nowrap"
                                            >
                                              {plate}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>

                                <td className="whitespace-nowrap p-3 text-center font-semibold">
                                  {log.qty}{" "}
                                  {selectedItem.unit ||
                                    ""}
                                </td>

                                <td className="whitespace-nowrap p-3 text-center text-gray-600">
                                  ₹
                                  {Number(
                                    log.unitRate ||
                                      0
                                  ).toLocaleString()}
                                </td>

                                <td className="whitespace-nowrap p-3 text-center font-bold text-gray-900">
                                  ₹
                                  {Number(
                                    cost || 0
                                  ).toLocaleString()}
                                </td>

                                {canEdit && (
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteLogEntry(
                                          log.id
                                        )
                                      }
                                      className="
                                        inline-flex
                                        min-h-11
                                        min-w-11
                                        items-center
                                        justify-center
                                        rounded-lg
                                        text-red-500
                                        hover:bg-red-50
                                        hover:text-red-700
                                      "
                                      aria-label="Delete log entry"
                                      title="Delete log entry"
                                    >
                                      <Trash2
                                        size={16}
                                      />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          }
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALS */}
              <div
                className="
                  mt-4 flex flex-col
                  gap-3 border-t
                  border-gray-200
                  pt-4 text-xs
                  font-semibold
                  text-gray-700
                  sm:flex-row
                  sm:flex-wrap
                  sm:items-center
                  sm:justify-between
                  sm:text-sm
                "
              >
                <div>
                  Total Logs:{" "}
                  {logs.length}
                </div>

                <div
                  className="
                    flex flex-wrap
                    gap-x-5 gap-y-2
                  "
                >
                  <span>
                    Total Qty:{" "}
                    <strong className="text-blue-600">
                      {totalLogQty}{" "}
                      {selectedItem.unit ||
                        ""}
                    </strong>
                  </span>

                  <span>
                    Total Cost:{" "}
                    <strong className="text-green-600">
                      ₹
                      {totalLogCost.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}