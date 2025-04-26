"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DataItem {
  label: string;
  value: string;
}

export interface Component {
  title: string;
  text?: string;
  chart: string;
  data: DataItem[];
}

const chartColors = ["#00BFFF", "#e1a95f", "#FF4500", "#FFE66D"];

const getChartData = (data: any) => {
  return {
    labels: data?.map((item: any) => item.label) || [],
    datasets: [
      {
        data: data?.map((item: any) => parseFloat(item.value)) || [],
        backgroundColor: chartColors,
      },
    ],
  };
};

export function PieChartComponent({ title, data }: Component) {
  const chartData = getChartData(data);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-white mb-2 font-medium text-xl">{title}</h1>
      <Pie data={chartData} />
    </div>
  );
}
