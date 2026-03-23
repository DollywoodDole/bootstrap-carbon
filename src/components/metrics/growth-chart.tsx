"use client"

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface Point {
  month:          string
  total_farms:    number
  total_hectares: number
  saas_mrr:       number
  credits_issued: number
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-")
  const label = new Date(Number(y), Number(mo) - 1, 1)
    .toLocaleString("en-CA", { month: "short", year: "2-digit" })
  return label
}

function fmtCad(v: number) {
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white shadow-md px-3 py-2 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-1.5">{fmtMonth(label)}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium tabular-nums text-gray-900">
            {p.dataKey === "saas_mrr"
              ? fmtCad(p.value)
              : p.dataKey === "total_hectares"
              ? `${p.value.toLocaleString("en-CA")} ha`
              : p.dataKey === "credits_issued"
              ? `${p.value.toFixed(1)} t`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function GrowthChart({ data }: { data: Point[] }) {
  return (
    <div className="space-y-6">
      {/* Main chart: hectares + MRR dual axis */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Land enrolled &amp; monthly recurring revenue
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="haGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={fmtMonth}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="ha"
              orientation="left"
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <YAxis
              yAxisId="mrr"
              orientation="right"
              tickFormatter={v => fmtCad(v)}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#6b7280" }}
              formatter={(value: string) =>
                value === "total_hectares" ? "Hectares" :
                value === "saas_mrr"       ? "MRR (CAD)" : value
              }
            />
            <Area
              yAxisId="ha"
              type="monotone"
              dataKey="total_hectares"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#haGrad)"
              dot={{ fill: "#0ea5e9", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name="total_hectares"
            />
            <Line
              yAxisId="mrr"
              type="monotone"
              dataKey="saas_mrr"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name="saas_mrr"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary chart: farms + credits */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Farm onboarding &amp; credit issuance
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={fmtMonth}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="farms"
              orientation="left"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="credits"
              orientation="right"
              tickFormatter={v => `${v}t`}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#6b7280" }}
              formatter={(value: string) =>
                value === "total_farms"    ? "Farms" :
                value === "credits_issued" ? "Credits issued (t)" : value
              }
            />
            <Line
              yAxisId="farms"
              type="monotone"
              dataKey="total_farms"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name="total_farms"
            />
            <Line
              yAxisId="credits"
              type="monotone"
              dataKey="credits_issued"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name="credits_issued"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
