"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyRevenueItem = {
  date: string;
  receita: number;
  comissao: number;
  medico: number;
};

type StatusItem = {
  name: string;
  value: number;
};

type MethodItem = {
  name: string;
  value: number;
};

type DoctorRevenueItem = {
  name: string;
  receita: number;
  comissao: number;
};

type FinanceChartsProps = {
  dailyRevenue: DailyRevenueItem[];
  statusData: StatusItem[];
  methodData: MethodItem[];
  doctorRevenue: DoctorRevenueItem[];
};

const chartColors = [
  "#08553F",
  "#00CF7B",
  "#F3EFA1",
  "#878787",
  "#C6C6C6",
  "#14532D",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function FinanceCharts({
  dailyRevenue,
  statusData,
  methodData,
  doctorRevenue,
}: FinanceChartsProps) {
  return (
    <div className="grid gap-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#08553F]">
          Receita por dia
        </h2>

        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="receita"
                name="Receita bruta"
                stroke="#08553F"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="comissao"
                name="Comissão"
                stroke="#00CF7B"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="medico"
                name="Valor médico"
                stroke="#878787"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-[#08553F]">
            Pagamentos por status
          </h2>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-[#08553F]">
            Métodos de pagamento
          </h2>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {methodData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#08553F]">
          Receita por médico
        </h2>

        <div className="mt-6 h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={doctorRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="receita" name="Receita bruta" fill="#08553F" />
              <Bar dataKey="comissao" name="Comissão" fill="#00CF7B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}