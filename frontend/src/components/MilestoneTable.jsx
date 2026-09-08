import React, { useState } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";

import { milestoneApi } from "../api/client";
import CrudModal from "./CrudModal";

function getProgressColor(percentage) {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function parseLength(val) {
  if (val == null || val === "") return 0;

  const num = parseFloat(
    String(val).replace(/[^0-9.]/g, "")
  );

  return Number.isNaN(num) ? 0 : num;
}

function calculateDays(startDate) {
  if (!startDate || startDate === "-") {
    return null;
  }

  const start = new Date(
    startDate + "T00:00:00"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays =
    Math.floor(
      (today - start) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return diffDays > 0 ? diffDays : 0;
}

const ADD_FIELDS = [
  {
    name: "name",
    label: "Milestone Name",
    type: "text",
    required: true,
  },
  {
    name: "target",
    label: "Total Length",
    type: "text",
    required: true,
  },
  {
    name: "achieved",
    label: "Achieved Length",
    type: "text",
    required: true,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
  },
];

const EDIT_FIELDS = [
  {
    name: "target",
    label: "Total Length",
    type: "text",
    required: true,
  },
  {
    name: "achieved",
    label: "Achieved Length",
    type: "text",
    required: true,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
  },
];

export default function MilestoneTable({
  data = [],
  road,
  onChanged,
  canEdit = true,
}) {
  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingRow, setEditingRow] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  const rows = data.map((row, index) => {
    const target = Number(
      row.target || 0
    );

    const achieved = Number(
      row.achieved || 0
    );

    const percentage =
      row.percentage_completed !==
        undefined &&
      row.percentage_completed !== null
        ? Number(
            row.percentage_completed
          )
        : target > 0
        ? Number(
            (
              (achieved / target) *
              100
            ).toFixed(2)
          )
        : 0;

    const startDate =
      row.start_date || "-";

    const endDate =
      row.end_date || "-";

    const days = calculateDays(
      row.start_date
    );

    return {
      key: row.id || index,
      id: row.id,
      index,
      name:
        row.name ||
        `Milestone ${index + 1}`,
      target,
      achieved,
      displayTarget:
        row.target_label ||
        (target ? String(target) : "-"),
      displayAchieved:
        row.achieved_label ||
        (achieved
          ? String(achieved)
          : "-"),
      startDate,
      endDate,
      days,
      percentage,
      progressColor:
        getProgressColor(percentage),
    };
  });

  function openAdd() {
    setEditingRow(null);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingRow(row);
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    const totalLength =
      parseLength(values.target);

    const achievedLength =
      parseLength(values.achieved);

    const payload = {
      road,
      milestoneName: editingRow
        ? editingRow.name
        : values.name,
      totalLength,
      achievedLength,
      targetLabel: values.target,
      achievedLabel: values.achieved,
      startDate:
        values.startDate || null,
      endDate:
        values.endDate || null,
    };

    if (editingRow) {
      await milestoneApi.update(
        payload
      );
    } else {
      await milestoneApi.add(
        payload
      );
    }

    setModalOpen(false);
    setEditingRow(null);

    if (onChanged) {
      onChanged();
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Delete this milestone?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      await milestoneApi.remove(id);

      if (onChanged) {
        onChanged();
      }
    } catch (err) {
      console.error(
        "Delete Milestone Error:",
        err
      );

      window.alert(
        err?.response?.data?.message ||
          "Failed to delete milestone."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
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
      "
    >
      {/* =========================
          HEADER
      ========================= */}

      <div
        className="
          mb-4
          flex
          min-w-0
          items-center
          justify-between
          gap-3
          sm:mb-5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <Layers
            className="shrink-0 text-blue-600"
            size={20}
          />

          <h2
            className="
              min-w-0
              truncate
              text-lg
              font-bold
              text-gray-800
              sm:text-xl
            "
          >
            Project Milestones
          </h2>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            disabled={!road}
            className="
              flex
              min-h-11
              shrink-0
              items-center
              gap-1.5
              rounded-lg
              bg-blue-600
              px-3
              py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-blue-700
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Plus size={16} />

            <span className="hidden sm:inline">
              Add Milestone
            </span>

            <span className="sm:hidden">
              Add
            </span>
          </button>
        )}
      </div>

      {/* =========================
          EMPTY
      ========================= */}

      {rows.length === 0 ? (
        <div
          className="
            flex
            min-h-[180px]
            items-center
            justify-center
            px-4
            py-8
            text-center
            text-sm
            text-gray-500
          "
        >
          No milestone data found.
        </div>
      ) : (
        <>
          {/* =========================
              MOBILE CARDS
          ========================= */}

          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <article
                key={row.key}
                className="
                  w-full
                  min-w-0
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  p-4
                  shadow-sm
                "
              >
                {/* Name + percentage */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-600
                        text-xs
                        font-semibold
                        text-white
                      "
                    >
                      {row.index + 1}
                    </span>

                    <span
                      className="
                        min-w-0
                        truncate
                        text-sm
                        font-semibold
                        text-gray-700
                      "
                      title={row.name}
                    >
                      {row.name}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-gray-700">
                    {row.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`
                        h-full
                        rounded-full
                        transition-all
                        duration-500
                        ${row.progressColor}
                      `}
                      style={{
                        width: `${Math.min(
                          Math.max(
                            row.percentage,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Lengths */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-lg bg-gray-50 p-2.5">
                    <p className="text-[11px] text-gray-500">
                      Total Length
                    </p>

                    <p
                      className="mt-0.5 truncate text-sm font-semibold text-gray-700"
                      title={row.displayTarget}
                    >
                      {row.displayTarget}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-lg bg-green-50 p-2.5">
                    <p className="text-[11px] text-green-600">
                      Achieved
                    </p>

                    <p
                      className="mt-0.5 truncate text-sm font-semibold text-green-700"
                      title={row.displayAchieved}
                    >
                      {row.displayAchieved}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                      <Calendar
                        size={13}
                        className="shrink-0"
                      />

                      <span className="truncate">
                        {row.startDate} →{" "}
                        {row.endDate}
                      </span>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {row.days != null
                        ? `${row.days} Days`
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(row)
                      }
                      className="
                        flex
                        min-h-11
                        flex-1
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        bg-blue-50
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-blue-600
                        transition
                        hover:bg-blue-100
                      "
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(row.id)
                      }
                      disabled={
                        deletingId ===
                        row.id
                      }
                      className="
                        flex
                        min-h-11
                        flex-1
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        bg-red-50
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-red-600
                        transition
                        hover:bg-red-100
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <Trash2 size={15} />

                      {deletingId ===
                      row.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* =========================
              TABLET + DESKTOP
          ========================= */}

          <div
            className="
              hidden
              w-full
              min-w-0
              overflow-x-auto
              md:block
              gc-table-scroll
            "
          >
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    #
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-left">
                    Milestone
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    Total Length
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    Achieved Length
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    Start Date
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    End Date
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 text-center">
                    Days
                  </th>

                  <th className="min-w-[180px] whitespace-nowrap px-3 py-3 text-center">
                    Progress
                  </th>

                  {canEdit && (
                    <th className="whitespace-nowrap px-3 py-3 text-center">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="
                      border-b
                      border-gray-100
                      transition
                      hover:bg-gray-50
                    "
                  >
                    <td className="px-3 py-4 text-center font-semibold">
                      {row.index + 1}
                    </td>

                    <td
                      className="
                        max-w-[220px]
                        truncate
                        px-3
                        py-4
                        font-semibold
                        text-gray-700
                      "
                      title={row.name}
                    >
                      {row.name}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      {row.displayTarget}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center font-bold text-green-600">
                      {row.displayAchieved}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center text-xs text-gray-600">
                      {row.startDate}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center text-xs text-gray-600">
                      {row.endDate}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {row.days != null
                          ? `${row.days} Days`
                          : "-"}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="w-full">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`
                              h-full
                              rounded-full
                              transition-all
                              duration-500
                              ${row.progressColor}
                            `}
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  row.percentage,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex justify-between gap-2 text-xs text-gray-600">
                          <span className="truncate">
                            {row.displayAchieved}{" "}
                            /{" "}
                            {row.displayTarget}
                          </span>

                          <span className="shrink-0 font-semibold">
                            {row.percentage.toFixed(
                              2
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </td>

                    {canEdit && (
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(row)
                            }
                            aria-label={`Edit ${row.name}`}
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-lg
                              text-blue-600
                              transition
                              hover:bg-blue-50
                              hover:text-blue-800
                            "
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                row.id
                              )
                            }
                            disabled={
                              deletingId ===
                              row.id
                            }
                            aria-label={`Delete ${row.name}`}
                            className="
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-lg
                              text-red-600
                              transition
                              hover:bg-red-50
                              hover:text-red-800
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            <Trash2
                              size={16}
                            />
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

      {/* =========================
          MODAL
      ========================= */}

      {canEdit && modalOpen && (
        <CrudModal
          title={
            editingRow
              ? `Edit "${editingRow.name}"`
              : "Add Milestone"
          }
          fields={
            editingRow
              ? EDIT_FIELDS
              : ADD_FIELDS
          }
          initialValues={
            editingRow
              ? {
                  target:
                    editingRow.displayTarget,
                  achieved:
                    editingRow.displayAchieved,
                  startDate:
                    editingRow.startDate !==
                    "-"
                      ? editingRow.startDate
                      : "",
                  endDate:
                    editingRow.endDate !==
                    "-"
                      ? editingRow.endDate
                      : "",
                }
              : {}
          }
          onClose={() => {
            setModalOpen(false);
            setEditingRow(null);
          }}
          onSubmit={handleSubmit}
          submitLabel={
            editingRow
              ? "Update"
              : "Add"
          }
        />
      )}
    </section>
  );
}