"use client";

import React, { useState, useMemo } from 'react';
import { BarChart3, Activity, AlertCircle, Zap, TrendingUp, Calendar } from 'lucide-react';
import { getTelemetryData, TelemetryPoint } from '@/lib/developerUtils';

type MetricType = 'tokens' | 'rtf' | 'errorRate' | 'requests';

export function UsageChart() {
  const [interval, setInterval] = useState<'7d' | '30d'>('7d');
  const [activeMetric, setActiveMetric] = useState<MetricType>('tokens');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data: TelemetryPoint[] = useMemo(() => {
    return getTelemetryData(interval);
  }, [interval]);

  // Aggregate metrics
  const aggregates = useMemo(() => {
    const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);
    const avgRtf = data.reduce((sum, d) => sum + d.rtf, 0) / (data.length || 1);
    const avgError = data.reduce((sum, d) => sum + d.errorRate, 0) / (data.length || 1);
    const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);

    return {
      totalTokens: `${totalTokens.toLocaleString()}k`,
      avgRtf: avgRtf.toFixed(3),
      avgError: `${avgError.toFixed(2)}%`,
      totalRequests: totalRequests.toLocaleString(),
    };
  }, [data]);

  // Metric visual configuration
  const metricConfig = {
    tokens: {
      label: 'Token Consumption',
      unit: 'k Tokens',
      color: '#818cf8', // Indigo
      gradientId: 'tokensGrad',
      format: (val: number) => `${val}k tokens`,
    },
    rtf: {
      label: 'Real-Time Factor (RTF)',
      unit: 'RTF',
      color: '#34d399', // Emerald
      gradientId: 'rtfGrad',
      format: (val: number) => `${val.toFixed(3)}x`,
    },
    errorRate: {
      label: 'API Error Rate',
      unit: '% Errors',
      color: '#f87171', // Rose
      gradientId: 'errorGrad',
      format: (val: number) => `${val.toFixed(2)}%`,
    },
    requests: {
      label: 'Total API Requests',
      unit: 'Calls',
      color: '#a78bfa', // Violet
      gradientId: 'reqGrad',
      format: (val: number) => `${val.toLocaleString()} calls`,
    },
  };

  const activeConf = metricConfig[activeMetric];

  // SVG Chart Geometry
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const chartData = useMemo(() => {
    const values = data.map((d) => d[activeMetric]);
    const maxVal = Math.max(...values) * 1.15 || 1;
    const minVal = Math.min(0, Math.min(...values));
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1 || 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((d[activeMetric] - minVal) / range) * (svgHeight - paddingY * 2);
      return { x, y, val: d[activeMetric], date: d.date, raw: d };
    });

    // Generate Path d string
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${(svgHeight - paddingY).toFixed(1)} L ${points[0].x.toFixed(1)},${(svgHeight - paddingY).toFixed(1)} Z`;

    return { points, linePath, areaPath, maxVal, minVal };
  }, [data, activeMetric]);

  const activeHoverPoint = hoveredIndex !== null ? chartData.points[hoveredIndex] : null;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-6">
      {/* Top Header: Title & Time Interval Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-100">
            <Activity className="text-indigo-400" size={18} />
            <h2 className="text-base font-semibold">Telemetry & Compute Consumption</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time infrastructure performance, token throughput, and service error rate
          </p>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setInterval('7d')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
              interval === '7d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setInterval('30d')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
              interval === '30d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Metric Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'tokens', label: 'Tokens Consumed', value: aggregates.totalTokens, icon: Zap, color: 'text-indigo-400' },
          { id: 'rtf', label: 'Avg Latency RTF', value: aggregates.avgRtf, icon: TrendingUp, color: 'text-emerald-400' },
          { id: 'errorRate', label: 'Error Rate', value: aggregates.avgError, icon: AlertCircle, color: 'text-rose-400' },
          { id: 'requests', label: 'API Calls', value: aggregates.totalRequests, icon: BarChart3, color: 'text-violet-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeMetric === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveMetric(tab.id as MetricType)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">{tab.label}</span>
                <Icon size={14} className={tab.color} />
              </div>
              <div className="text-base font-bold text-white font-mono">{tab.value}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 pt-6 overflow-hidden">
        {/* Tooltip Overlay */}
        {activeHoverPoint && (
          <div
            className="absolute z-20 bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-12 transition-all font-mono"
            style={{
              left: `${(activeHoverPoint.x / svgWidth) * 100}%`,
              top: `${activeHoverPoint.y}px`,
            }}
          >
            <div className="text-[10px] text-slate-400 mb-0.5">{activeHoverPoint.date}</div>
            <div className="font-bold text-indigo-300">
              {activeConf.format(activeHoverPoint.val)}
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-64 overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeConf.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={activeConf.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((tick) => {
            const y = svgHeight - paddingY - tick * (svgHeight - paddingY * 2);
            return (
              <line
                key={tick}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Target Reference Line for RTF */}
          {activeMetric === 'rtf' && (
            <g>
              <line
                x1={paddingX}
                y1={svgHeight - paddingY - ((0.35 - chartData.minVal) / (chartData.maxVal - chartData.minVal || 1)) * (svgHeight - paddingY * 2)}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY - ((0.35 - chartData.minVal) / (chartData.maxVal - chartData.minVal || 1)) * (svgHeight - paddingY * 2)}
                stroke="#10b981"
                strokeDasharray="6 3"
                strokeWidth="1.5"
                className="opacity-60"
              />
              <text
                x={svgWidth - paddingX - 100}
                y={svgHeight - paddingY - ((0.35 - chartData.minVal) / (chartData.maxVal - chartData.minVal || 1)) * (svgHeight - paddingY * 2) - 4}
                fill="#34d399"
                fontSize="10"
                fontFamily="monospace"
              >
                Target RTF &lt; 0.35
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={chartData.areaPath} fill="url(#chartGradient)" />

          {/* Line Stroke */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke={activeConf.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Point Dots */}
          {chartData.points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? '6' : '3.5'}
                fill={hoveredIndex === idx ? '#ffffff' : activeConf.color}
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Date Labels on X-Axis */}
              {(interval === '7d' || idx % 5 === 0 || idx === chartData.points.length - 1) && (
                <text
                  x={p.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.date}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
