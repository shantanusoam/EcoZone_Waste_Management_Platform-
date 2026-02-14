"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsChartsProps {
  binsByStatus: Record<string, number>;
  fillDistribution: { empty: number; medium: number; full: number };
  pickupData: Array<{ id: string; fill: number }>;
  collectionsByDay?: Array<{ date: string; count: number; label: string }>;
  driverPerformance?: Array<{ driver: string; routes: number; collected: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  inactive: "#ef4444",
  maintenance: "#f59e0b",
};

const FILL_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsCharts({
  binsByStatus,
  fillDistribution,
  pickupData,
  collectionsByDay = [],
  driverPerformance = [],
}: AnalyticsChartsProps) {
  // Format data for pie chart
  const statusData = Object.entries(binsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  // Format fill distribution for bar chart
  const fillData = [
    { name: "Empty (0-33%)", value: fillDistribution.empty },
    { name: "Medium (33-66%)", value: fillDistribution.medium },
    { name: "Full (66-100%)", value: fillDistribution.full },
  ];

  return (
    <div className="space-y-6">
      {/* Collections over time (last 7 days) */}
      {collectionsByDay.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">Collections Over Time (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={collectionsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Collections" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Driver performance (last 30 days) */}
      {driverPerformance.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">Driver Performance (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={driverPerformance} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="driver" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="routes" fill="#3b82f6" name="Routes" radius={[0, 4, 4, 0]} />
              <Bar dataKey="collected" fill="#10b981" name="Stops Collected" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bins by Status - Pie Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Bin Status Distribution</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No bin data available
          </div>
        )}
      </div>

      {/* Fill Level Distribution - Bar Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Fill Level Distribution</h3>
        {fillData.some((d) => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fillData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {fillData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={FILL_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No fill data available
          </div>
        )}
      </div>

      {/* Recent Pickups - Line Chart */}
      {pickupData.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Pickup Fill Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pickupData.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis label={{ value: "Fill %", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="fill"
                stroke="#10b981"
                dot={false}
                name="Fill Level %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
