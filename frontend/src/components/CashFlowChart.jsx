import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CashFlowChart({ projection, currentCash }) {
  const data = [
    {
      date: "Today",
      balance: Number(currentCash),
      description: "Current cash",
    },
    ...projection.map((item) => ({
      date: item.date,
      balance: Number(item.cashBalance),
      description: item.description,
      change: Number(item.change),
    })),
  ];

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{
            top: 15,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient
              id="cashGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#5b5cf0"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="#5b5cf0"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e8eaf0"
          />

          <XAxis
            dataKey="date"
            tickFormatter={(date) => {
              if (date === "Today") return date;

              const d = new Date(date);

              return d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });
            }}
            tick={{
              fontSize: 12,
              fill: "#8a8f9f",
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(value) =>
              `₹${(value / 1000).toFixed(0)}k`
            }
            tick={{
              fontSize: 12,
              fill: "#8a8f9f",
            }}
            axisLine={false}
            tickLine={false}
            width={55}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e6e8ef",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => [
              `₹${Number(value).toLocaleString("en-IN")}`,
              "Cash balance",
            ]}
            labelFormatter={(label) => label}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#5b5cf0"
            strokeWidth={3}
            fill="url(#cashGradient)"
            dot={{
              r: 4,
              fill: "#5b5cf0",
              strokeWidth: 2,
              stroke: "#fff",
            }}
            activeDot={{
              r: 7,
            }}
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CashFlowChart;