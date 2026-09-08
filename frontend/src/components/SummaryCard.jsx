import React from "react";
import {
  CheckCircle,
  Layers,
  Map,
  Package,
} from "lucide-react";

export default function SummaryCard({
  selectedWard,
  selectedRoad,
  milestones = [],
  materials = [],
}) {
  const target = milestones.reduce(
    (sum, item) => sum + Number(item.target || 0),
    0
  );

  const achieved = milestones.reduce(
    (sum, item) => sum + Number(item.achieved || 0),
    0
  );

  const completion = target
    ? Math.min(
        100,
        Math.round((achieved / target) * 100)
      )
    : 0;

  const stats = [
    {
      label: "Ward",
      value: selectedWard || "Not selected",
      Icon: Map,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Road",
      value: selectedRoad || "Not selected",
      Icon: Layers,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Materials",
      value: materials.length,
      Icon: Package,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Completion",
      value: `${completion}%`,
      Icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <section
      className="
        w-full
        min-w-0
        overflow-hidden
        rounded-xl
        bg-white
        p-4
        shadow-md
        sm:p-5
        md:p-6
      "
    >
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
          Project Summary
        </h2>

        {selectedRoad && (
          <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
            {selectedRoad}
          </p>
        )}
      </div>

      {/* Stats */}
      <div
        className="
          grid
          grid-cols-2
          gap-3
          sm:grid-cols-2
          sm:gap-4
          lg:grid-cols-1
          lg:gap-5
        "
      >
        {stats.map(
          ({ label, value, Icon, color }) => (
            <div
              key={label}
              className="
                flex
                min-w-0
                items-center
                gap-2.5
                rounded-lg
                border
                border-gray-100
                bg-gray-50
                p-3
                sm:gap-3
                sm:p-3.5
                lg:border-0
                lg:bg-transparent
                lg:p-0
              "
            >
              {/* Icon */}
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  sm:h-11
                  sm:w-11
                  ${color}
                `}
              >
                <Icon size={20} />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 sm:text-sm">
                  {label}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-sm
                    font-semibold
                    text-gray-800
                    sm:text-base
                  "
                  title={String(value)}
                >
                  {value}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Progress */}
      <div className="mt-6 sm:mt-7 lg:mt-8">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">
            Progress
          </span>

          <strong className="shrink-0 text-sm text-gray-800 sm:text-base">
            {completion}%
          </strong>
        </div>

        <div
          className="
            h-3
            w-full
            overflow-hidden
            rounded-full
            bg-gray-200
          "
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Project completion"
        >
          <div
            className="
              h-full
              rounded-full
              bg-blue-600
              transition-all
              duration-500
            "
            style={{
              width: `${completion}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}