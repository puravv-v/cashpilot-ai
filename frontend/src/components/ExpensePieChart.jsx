import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#5b5cf0",
  "#7c83fd",
  "#9ba1ff",
  "#b9bdff",
  "#d3d6ff",
];

function ExpensePieChart({ items }) {
  if (!items.length) {
    return (
      <div className="empty-chart">
        No upcoming expenses
      </div>
    );
  }

  return (
    <div className="pie-chart-container">

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>

          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={72}
            outerRadius={108}
            paddingAngle={3}
          >
            {items.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) =>
              `₹${Number(value).toLocaleString("en-IN")}`
            }
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e6e8ef",
            }}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />

        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}

export default ExpensePieChart;