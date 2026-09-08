import React from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
} from "recharts";

import useMediaQuery from "../hooks/useMediaQuery";

const COLORS = [
  "#1E88E5",
  "#E5502A",
  "#D6A32C",
  "#455A64",
  "#26A374",
  "#9C5FE0",
  "#F2B705",
  "#3AA0C9",
];

function renderOuterLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
  index,
}) {
  if (percent === 0) return null;

  const RAD = Math.PI / 180;

  const sin = Math.sin(-midAngle * RAD);
  const cos = Math.cos(-midAngle * RAD);

  const startX =
    cx + (outerRadius + 4) * cos;

  const startY =
    cy + (outerRadius + 4) * sin;

  const bendX =
    cx + (outerRadius + 14) * cos;

  const bendY =
    cy + (outerRadius + 14) * sin;

  const endX =
    bendX + (cos >= 0 ? 10 : -10);

  const color =
    COLORS[index % COLORS.length];

  return (
    <g>
      <path
        d={`M${startX},${startY}L${bendX},${bendY}L${endX},${bendY}`}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />

      <text
        x={endX + (cos >= 0 ? 4 : -4)}
        y={bendY}
        textAnchor={
          cos >= 0 ? "start" : "end"
        }
        dominantBaseline="central"
        fontSize={10}
        fontWeight={600}
        fill={color}
      >
        {(percent * 100).toFixed(0)}%
      </text>
    </g>
  );
}

function renderActiveShape(props) {
  const { outerRadius } = props;

  return (
    <Sector
      {...props}
      outerRadius={outerRadius + 6}
    />
  );
}

export default function ResourcePieChart({
  data = [],
}) {
  const isCompact = useMediaQuery(
    "(max-width: 639px)"
  );

  const [activeIndex, setActiveIndex] =
    React.useState(null);

  const chartData = data.map((item) => ({
    ...item,
    value: Number(item.value || 0),
  }));

  const total = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const outerRadius = isCompact
    ? 78
    : 118;

  const innerRadius = isCompact
    ? 50
    : 78;

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
      {/* =========================
          HEADER
      ========================= */}

      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-[#EFF4F8]
          "
        >
          <PieChartIcon
            className="text-[#2C5F8A]"
            size={21}
          />
        </div>

        <div className="min-w-0">
          <h2
            className="
              truncate
              text-lg
              font-bold
              text-gray-800
              sm:text-xl
            "
          >
            TM Distribution
          </h2>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            Overview of available construction
            materials
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-4 h-px w-full sm:my-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, #D8DEE4 0, #D8DEE4 4px, transparent 4px, transparent 8px)",
        }}
      />

      {/* =========================
          EMPTY
      ========================= */}

      {chartData.length === 0 ? (
        <div
          className="
            flex
            min-h-[260px]
            items-center
            justify-center
            px-4
            text-center
            text-sm
            text-gray-500
            sm:min-h-[320px]
          "
        >
          No material data available.
        </div>
      ) : (
        <>
          {/* =========================
              PIE CHART
          ========================= */}

          <div
            className="
              relative
              h-[280px]
              w-full
              min-w-0
              sm:h-[330px]
              md:h-[380px]
              lg:h-[400px]
            "
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy={isCompact ? "45%" : "50%"}
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={isCompact ? 2 : 3}
                  label={
                    isCompact
                      ? false
                      : renderOuterLabel
                  }
                  labelLine={false}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) =>
                    setActiveIndex(index)
                  }
                  onMouseLeave={() =>
                    setActiveIndex(null)
                  }
                >
                  {chartData.map(
                    (item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value) => [
                    value,
                    "Quantity",
                  ]}
                  contentStyle={{
                    borderRadius:
                      "0.5rem",
                    borderColor:
                      "#E5E7EB",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center total */}
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                flex
                items-center
                justify-center
              "
            >
              <div className="text-center">
                <p
                  className="
                    font-mono
                    text-2xl
                    font-bold
                    tabular-nums
                    text-gray-800
                    sm:text-3xl
                    md:text-4xl
                  "
                >
                  {total}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    uppercase
                    tracking-widest
                    text-gray-400
                    sm:text-[10px]
                  "
                >
                  Total units
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              MATERIAL LIST
          ========================= */}

          <div className="mt-4 space-y-3 sm:mt-6">
            {chartData.map(
              (item, index) => {
                const percent =
                  total === 0
                    ? 0
                    : (item.value /
                        total) *
                      100;

                const color =
                  COLORS[
                    index %
                      COLORS.length
                  ];

                return (
                  <div
                    key={`${item.name}-${index}`}
                    className="
                      min-w-0
                      rounded-lg
                      bg-gray-50
                      p-2.5
                      sm:bg-transparent
                      sm:p-0
                    "
                  >
                    {/* Name / quantity / percentage */}
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          h-2.5
                          w-2.5
                          shrink-0
                          rounded-sm
                        "
                        style={{
                          backgroundColor:
                            color,
                        }}
                      />

                      <span
                        className="
                          min-w-0
                          flex-1
                          truncate
                          text-sm
                          font-medium
                          text-gray-800
                          sm:text-[15px]
                        "
                        title={item.name}
                      >
                        {item.name}
                      </span>

                      <span className="shrink-0 font-mono text-sm tabular-nums text-gray-700">
                        {item.value}
                      </span>

                      <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums text-gray-400">
                        {percent.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              percent,
                              0
                            ),
                            100
                          )}%`,
                          backgroundColor:
                            color,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </section>
  );
}