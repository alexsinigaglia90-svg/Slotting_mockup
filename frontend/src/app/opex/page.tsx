"use client";

import { useState } from "react";

interface OpexParams {
  ordersPerDay: number;
  hourlyLaborCost: number;
  shiftHours: number;
  annualFteCost: number;
  walkingSpeed: number;
  handlingTime: number;
}

const defaults: OpexParams = {
  ordersPerDay: 3500,
  hourlyLaborCost: 25,
  shiftHours: 7.5,
  annualFteCost: 50000,
  walkingSpeed: 1.2,
  handlingTime: 12,
};

function calcKpis(distPerOrder: number, picksPerOrder: number, params: OpexParams) {
  const distPerPick = distPerOrder / Math.max(picksPerOrder, 1);
  const timePerPick = distPerPick / params.walkingSpeed + params.handlingTime;
  const picksPerHour = 3600 / timePerPick;
  const ordersPerHour = picksPerHour / Math.max(picksPerOrder, 1);
  const ordersPerShift = ordersPerHour * params.shiftHours;
  const costPerOrder = params.hourlyLaborCost / Math.max(ordersPerHour, 0.01);
  const fteNeeded = params.ordersPerDay / Math.max(ordersPerShift, 0.01);
  const annualCost = fteNeeded * params.annualFteCost;
  return { picksPerHour, ordersPerShift, costPerOrder, fteNeeded, annualCost };
}

export default function OpexPage() {
  const [params, setParams] = useState(defaults);

  // Use demo values (from Sprint 2 integration test: before=159.2, after=28.0, picks/order~25)
  const before = calcKpis(159.2, 25, params);
  const after = calcKpis(28.0, 25, params);
  const fteSaved = before.fteNeeded - after.fteNeeded;
  const annualSaving = fteSaved * params.annualFteCost;

  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Opex Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KpiCard label="Picks / Hour" before={before.picksPerHour} after={after.picksPerHour} unit="" />
        <KpiCard label="Orders / Shift" before={before.ordersPerShift} after={after.ordersPerShift} unit="" />
        <KpiCard label="Cost / Order" before={before.costPerOrder} after={after.costPerOrder} unit="EUR" invert />
        <KpiCard label="FTE Required" before={before.fteNeeded} after={after.fteNeeded} unit="" invert />
      </div>

      {/* FTE Impact */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
        <h3 className="text-lg font-semibold mb-4">FTE Impact Calculator</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-1">Before Optimization</p>
            <p className="text-3xl font-bold text-red-400">{before.fteNeeded.toFixed(0)} FTE</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-1">After Optimization</p>
            <p className="text-3xl font-bold text-green-400">{after.fteNeeded.toFixed(0)} FTE</p>
          </div>
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-1">Annual Saving</p>
            <p className="text-3xl font-bold text-green-400">EUR {(annualSaving / 1_000_000).toFixed(1)}M</p>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
        <h3 className="text-lg font-semibold mb-4">Parameters</h3>
        <div className="grid grid-cols-3 gap-4">
          <ParamSlider label="Orders / Day" value={params.ordersPerDay} min={1000} max={6000} step={100}
            onChange={v => setParams(p => ({ ...p, ordersPerDay: v }))} />
          <ParamSlider label="Hourly Labor (EUR)" value={params.hourlyLaborCost} min={18} max={35} step={1}
            onChange={v => setParams(p => ({ ...p, hourlyLaborCost: v }))} />
          <ParamSlider label="Shift Hours" value={params.shiftHours} min={6} max={10} step={0.5}
            onChange={v => setParams(p => ({ ...p, shiftHours: v }))} />
          <ParamSlider label="Annual FTE Cost (EUR)" value={params.annualFteCost} min={40000} max={65000} step={1000}
            onChange={v => setParams(p => ({ ...p, annualFteCost: v }))} />
          <ParamSlider label="Walking Speed (m/s)" value={params.walkingSpeed} min={0.8} max={1.5} step={0.1}
            onChange={v => setParams(p => ({ ...p, walkingSpeed: v }))} />
          <ParamSlider label="Handling Time (s)" value={params.handlingTime} min={8} max={18} step={1}
            onChange={v => setParams(p => ({ ...p, handlingTime: v }))} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, before, after, unit, invert }: { label: string; before: number; after: number; unit: string; invert?: boolean }) {
  const improved = invert ? after < before : after > before;
  const pctChange = ((after - before) / Math.max(before, 0.01)) * 100;
  return (
    <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
      <p className="text-xs text-[var(--muted-foreground)] mb-2">{label}</p>
      <p className="text-2xl font-bold">{unit === "EUR" ? `EUR ${after.toFixed(2)}` : after.toFixed(1)}</p>
      <p className={`text-xs mt-1 ${improved ? "text-green-400" : "text-red-400"}`}>
        {pctChange > 0 ? "+" : ""}{pctChange.toFixed(0)}% vs before
      </p>
    </div>
  );
}

function ParamSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-sm text-[var(--muted-foreground)] block mb-1">{label}: {value}</label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}
