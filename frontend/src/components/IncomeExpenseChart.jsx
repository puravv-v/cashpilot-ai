import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function IncomeExpenseChart({ income, expenses }) {
  const data = [
    {
      category: "Income",
      amount: income.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    },
    {
      category: "Expenses",
      amount: expenses.reduce(
        (sum, item) => sum + item.value,
        0
      ),
    },
  ];

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e8eaf0"
          />

          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8a8f9f",
              fontSize: 12,
            }}
          />

          <YAxis
            tickFormatter={(value) =>
              `₹${(value / 1000).toFixed(0)}k`
            }
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8a8f9f",
              fontSize: 12,
            }}
          />

          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              "Amount",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e6e8ef",
            }}
          />

          <Legend />

          <Bar
            dataKey="amount"
            name="Cash movement"
            fill="#5b5cf0"
            radius={[8, 8, 0, 0]}
            barSize={55}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default IncomeExpenseChart;