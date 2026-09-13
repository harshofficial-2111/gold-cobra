import React, { useState } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Legend,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  PieChart,
  BarChart as BarChartIcon,
} from "lucide-react";

import useMediaQuery from "../hooks/useMediaQuery";

const RING_COLORS = [
  "#8B5A2B",
  "#16A34A",
  "#A78BFA",
  "#EAB308",
  "#FB7185",
  "#38BDF8",
  "#2DD4BF",
  "#EF29FF",
  "#2563EB",
  "#F97316",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#94A3B8",
];

function parseLength(val) {
  if (val == null) return 0;

  const num = parseFloat(
    String(val).replace(/[^0-9.]/g, "")
  );

  return Number.isNaN(num) ? 0 : num;
}

export default function MilestoneCircleChart({
  data = [],
}) {
  const isCompact = useMediaQuery("(max-width: 767px)");

  const [chartType, setChartType] = useState("circle");

  /* =========================
     CIRCLE DATA
  ========================= */

  const circleData = data.map((item, index) => {
    const percent =
      item.percentage_completed ??
      (item.target > 0
        ? (item.achieved / item.target) * 100
        : 0);

    return {
      name:
        item.name ||
        item.milestoneName ||
        item.milestone_name ||
        `Milestone ${index + 1}`,

      value: Math.max(
        Math.min(Number(percent) || 0, 100),
        1
      ),

      fill:
        RING_COLORS[index % RING_COLORS.length],
    };
  });

  /* =========================
     BAR DATA
  ========================= */

  const barData = data.map((item, index) => {
    const target = parseLength(
      item.target ??
        item.totalLength ??
        item.total_length
    );

    const achieved = parseLength(
      item.achieved ??
        item.achievedLength ??
        item.achieved_length
    );

    const fullName =
      item.name ||
      item.milestoneName ||
      item.milestone_name ||
      `Milestone ${index + 1}`;

    return {
      fullName,

      shortName:
        fullName.length > (isCompact ? 6 : 10)
          ? `${fullName.slice(
              0,
              isCompact ? 5 : 9
            )}…`
          : fullName,

      Total: target,
      Achieved: achieved,

      targetLabel:
        item.target_label ||
        (target ? `${target}m` : "0m"),

      achievedLabel:
        item.achieved_label ||
        (achieved ? `${achieved}m` : "0m"),
    };
  });

  const isEmpty = data.length === 0;

  const minBarWidth = Math.max(
    barData.length * (isCompact ? 65 : 80),
    isCompact ? 320 : 500
  );

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
          {chartType === "circle" ? (
            <PieChart
              className="shrink-0 text-blue-600"
              size={20}
            />
          ) : (
            <BarChartIcon
              className="shrink-0 text-blue-600"
              size={20}
            />
          )}

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
            Project Progress Overview
          </h2>
        </div>

        <select
          value={chartType}
          onChange={(e) =>
            setChartType(e.target.value)
          }
          aria-label="Chart type"
          className="
            h-11
            shrink-0
            rounded-lg
            border
            border-gray-300
            bg-white
            px-2
            text-sm
            text-gray-700
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500
            sm:px-3
          "
        >
          <option value="circle">
            Circle View
          </option>

          <option value="bar">
            Bar View
          </option>
        </select>
      </div>

      {/* =========================
          EMPTY
      ========================= */}

      {isEmpty ? (
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
          No milestone data available.
        </div>
      ) : chartType === "circle" ? (
        /* =========================
           CIRCLE CHART
        ========================= */

        <div
          className="
            h-[350px]
            w-full
            min-w-0
            sm:h-[390px]
            md:h-[420px]
          "
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <RadialBarChart
              data={circleData}
              innerRadius={
                isCompact ? "18%" : "15%"
              }
              outerRadius={
                isCompact ? "68%" : "78%"
              }
              startAngle={90}
              endAngle={-270}
              cx={isCompact ? "50%" : "43%"}
              cy={isCompact ? "43%" : "50%"}
              margin={{
                top: 10,
                right: isCompact ? 5 : 20,
                bottom: isCompact ? 55 : 10,
                left: isCompact ? 5 : 10,
              }}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />

              <RadialBar
                dataKey="value"
                background
                cornerRadius={4}
                label={{
                  fill: "#333",
                  position: "insideStart",
                  fontSize: isCompact ? 8 : 10,
                  formatter: (value) =>
                    `${Number(value).toFixed(0)}%`,
                }}
              >
                {circleData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                    />
                  )
                )}
              </RadialBar>

              <Legend
                iconSize={9}
                layout={
                  isCompact
                    ? "horizontal"
                    : "vertical"
                }
                verticalAlign={
                  isCompact
                    ? "bottom"
                    : "middle"
                }
                align={
                  isCompact
                    ? "center"
                    : "right"
                }
                wrapperStyle={{
                  fontSize: isCompact ? 10 : 12,
                  lineHeight: isCompact
                    ? "18px"
                    : "20px",
                  maxWidth: isCompact
                    ? "100%"
                    : "150px",
                  overflow: "hidden",
                }}
              />

              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)}%`,
                  "Completed",
                ]}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* =========================
           BAR CHART
        ========================= */

        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overflow-y-hidden
            pb-2
          "
        >
          <div
            style={{
              width: `${minBarWidth}px`,
              minWidth: "100%",
              height: isCompact
                ? "320px"
                : "350px",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={barData}
                margin={{
                  top: 10,
                  right: isCompact ? 8 : 20,
                  left: isCompact ? -18 : -10,
                  bottom: isCompact ? 55 : 50,
                }}
                barGap={isCompact ? 4 : 8}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F3F4F6"
                />

                <XAxis
                  dataKey="shortName"
                  tick={{
                    fill: "#4B5563",
                    fontSize: isCompact ? 9 : 11,
                  }}
                  interval={0}
                  angle={isCompact ? -40 : -30}
                  textAnchor="end"
                  height={isCompact ? 60 : 55}
                />

                <YAxis
                  tick={{
                    fill: "#6B7280",
                    fontSize: isCompact ? 9 : 11,
                  }}
                  width={isCompact ? 35 : 45}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E7EB",
                    borderRadius: "0.5rem",
                    boxShadow:
                      "0 4px 6px -1px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  labelFormatter={(
                    value,
                    items
                  ) => {
                    if (
                      items &&
                      items[0]
                    ) {
                      return items[0].payload
                        .fullName;
                    }

                    return value;
                  }}
                  formatter={(
                    value,
                    name,
                    props
                  ) => {
                    const isTotal =
                      name === "Total" ||
                      name === "Total Length";

                    const label = isTotal
                      ? props.payload
                          .targetLabel
                      : props.payload
                          .achievedLabel;

                    return [label, name];
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{
                    paddingBottom: "10px",
                    fontSize: isCompact
                      ? "10px"
                      : "12px",
                  }}
                />

                <Bar
                  dataKey="Total"
                  name="Total Length"
                  fill="#93C5FD"
                  radius={[4, 4, 0, 0]}
                  barSize={
                    isCompact ? 13 : 18
                  }
                />

                <Bar
                  dataKey="Achieved"
                  name="Achieved Length"
                  fill="#16A34A"
                  radius={[4, 4, 0, 0]}
                  barSize={
                    isCompact ? 13 : 18
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}