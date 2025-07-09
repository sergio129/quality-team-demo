'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MetricasCalidadChartProps {
  tipo: 'linea' | 'barra' | 'dona';
  datos: number[];
  etiquetas: string[];
  titulo: string;
  color?: string;
  altura?: number;
}

export const MetricasCalidadChart: React.FC<MetricasCalidadChartProps> = ({
  tipo,
  datos,
  etiquetas,
  titulo,
  color = '#2563eb',
  altura = 400
}) => {
  const opcionesComunes = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: titulo,
        font: {
          size: 16,
          weight: 'bold' as const,
          family: "'Inter', sans-serif"
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8
      }
    }
  };

  const datosGrafico = {
    labels: etiquetas,
    datasets: [
      {
        label: titulo,
        data: datos,
        borderColor: color,
        backgroundColor: tipo === 'dona' 
          ? [
              '#2563eb',
              '#dc2626',
              '#16a34a',
              '#ca8a04',
              '#9333ea',
              '#c2410c'
            ]
          : `${color}20`,
        borderWidth: 2,
        tension: tipo === 'linea' ? 0.4 : 0,
        fill: tipo === 'linea' ? false : true,
        borderRadius: tipo === 'barra' ? 4 : 0,
      }
    ]
  };

  const opcionesLinea = {
    ...opcionesComunes,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  };

  const opcionesBarra = {
    ...opcionesComunes,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  };

  const opcionesDona = {
    ...opcionesComunes,
    cutout: '60%',
    plugins: {
      ...opcionesComunes.plugins,
      legend: {
        ...opcionesComunes.plugins.legend,
        position: 'bottom' as const
      }
    }
  };

  const renderizarGrafico = () => {
    switch (tipo) {
      case 'linea':
        return <Line data={datosGrafico} options={opcionesLinea} />;
      case 'barra':
        return <Bar data={datosGrafico} options={opcionesBarra} />;
      case 'dona':
        return <Doughnut data={datosGrafico} options={opcionesDona} />;
      default:
        return <Line data={datosGrafico} options={opcionesLinea} />;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <div style={{ height: `${altura}px` }}>
        {renderizarGrafico()}
      </div>
    </div>
  );
};
