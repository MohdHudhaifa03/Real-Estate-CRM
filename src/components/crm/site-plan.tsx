"use client";

import { useMemo } from "react";
import Image from "next/image";

import masterPlanImg from "@/assets/master-site-plan.jpg";
import type { Unit } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Coordinate layout — distributes units in a clean grid on the map   */
/* ------------------------------------------------------------------ */

/**
 * Deterministic seeded random for stable jitter across renders.
 */
function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generates clean percentage-based (x%, y%) grid coordinates for each unit,
 * distributed across block-specific zones on the master plan image.
 */
function generateCoordinates(
  units: Unit[],
  blocks: string[],
): Map<string, { x: number; y: number }> {
  const coords = new Map<string, { x: number; y: number }>();

  const zones = [
    { x: 8, y: 55, w: 22, h: 35 },
    { x: 35, y: 52, w: 28, h: 38 },
    { x: 65, y: 52, w: 28, h: 38 },
    { x: 10, y: 12, w: 35, h: 35 },
    { x: 50, y: 12, w: 35, h: 35 },
    { x: 30, y: 30, w: 40, h: 25 },
  ];

  blocks.forEach((block, bi) => {
    const zone = zones[bi % zones.length]!;
    const blockUnits = units.filter((u) => u.block === block);
    const cols = Math.ceil(Math.sqrt(blockUnits.length));
    const rows = Math.ceil(blockUnits.length / cols);

    blockUnits.forEach((unit, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const seed = bi * 97 + i * 13;

      const baseX = zone.x + (zone.w / (cols + 1)) * (col + 1);
      const baseY = zone.y + (zone.h / (rows + 1)) * (row + 1);
      const jitterX = (seededRandom(seed) - 0.5) * (zone.w / (cols + 1)) * 0.25;
      const jitterY = (seededRandom(seed + 1) - 0.5) * (zone.h / (rows + 1)) * 0.25;

      coords.set(unit.id, {
        x: Math.max(3, Math.min(94, baseX + jitterX)),
        y: Math.max(3, Math.min(94, baseY + jitterY)),
      });
    });
  });

  return coords;
}

/* ------------------------------------------------------------------ */
/*  Plot marker component                                              */
/* ------------------------------------------------------------------ */

function PlotMarker({
  unit,
  x,
  y,
  isSelected,
  onSelect,
}: {
  unit: Unit;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: (unit: Unit) => void;
}) {
  const isAvailable = unit.status === "available";
  const isBooked = unit.status === "reserved" || unit.status === "sold";

  // Extract short plot number from code (e.g. "TO-101" → "101")
  const plotNum = unit.code.replace(/^[A-Z]+-/, "");

  /* ---- Booked / Sold: red dot with strikethrough number ---- */
  if (isBooked) {
    return (
      <div
        className="absolute flex flex-col items-center pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 5,
        }}
        aria-label={`Plot ${unit.code} — ${unit.status}`}
      >
        {/* Red dot */}
        <span
          className="rounded-full"
          style={{
            width: 12,
            height: 12,
            backgroundColor: "#dc2626",
            boxShadow: "0 0 6px rgba(220, 38, 38, 0.5)",
          }}
        />
        {/* Plot number (dimmed, strikethrough) */}
        <span
          className="mt-0.5 font-sans text-[10px] font-semibold leading-none line-through"
          style={{
            color: "rgba(160, 50, 50, 0.7)",
            textShadow: "0 1px 2px rgba(255,255,255,0.6)",
          }}
        >
          {plotNum}
        </span>
      </div>
    );
  }

  /* ---- Available: clean yellow number, clickable ---- */
  return (
    <button
      onClick={() => onSelect(unit)}
      className={cn(
        "absolute flex flex-col items-center transition-all duration-200 ease-out",
        "hover:scale-125 cursor-pointer"
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 30 : 10,
      }}
      aria-label={`Plot ${unit.code} — available — click to book`}
    >
      {/* Selection ring */}
      {isSelected && (
        <span
          className="absolute -inset-2 rounded-lg animate-ping"
          style={{
            backgroundColor: "rgba(72, 140, 88, 0.2)",
          }}
        />
      )}

      {/* Plot number */}
      <span
        className={cn(
          "relative font-sans font-bold leading-none transition-all duration-200",
          isSelected ? "text-base" : "text-sm",
        )}
        style={{
          color: isSelected ? "#fff" : "#e8d44d",
          textShadow: isSelected
            ? "0 0 10px rgba(72, 140, 88, 0.9), 0 1px 3px rgba(0,0,0,0.6)"
            : "0 1px 3px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.3)",
        }}
      >
        {plotNum}
      </span>

      {/* Green dot indicator under the number for available */}
      <span
        className={cn(
          "mt-0.5 rounded-full transition-all duration-200",
          isSelected && "animate-pulse",
        )}
        style={{
          width: isSelected ? 8 : 5,
          height: isSelected ? 8 : 5,
          backgroundColor: isSelected ? "#4ade80" : "rgba(74, 222, 128, 0.7)",
          boxShadow: isSelected ? "0 0 8px rgba(74, 222, 128, 0.6)" : "none",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main SitePlan                                                      */
/* ------------------------------------------------------------------ */

export function SitePlan({
  units,
  blocks,
  selectedUnitId,
  onSelect,
}: {
  units: Unit[];
  blocks: string[];
  selectedUnitId?: string | undefined;
  onSelect: (unit: Unit) => void;
}) {
  const coords = useMemo(() => generateCoordinates(units, blocks), [units, blocks]);

  const availableCount = units.filter((u) => u.status === "available").length;
  const bookedCount = units.filter((u) => u.status !== "available").length;

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="tilt-scene">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          {/* Background master plan image */}
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={masterPlanImg}
              alt="Master site plan"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
            />

            {/* Plot markers */}
            {units.map((unit) => {
              const pos = coords.get(unit.id);
              if (!pos) return null;
              return (
                <PlotMarker
                  key={unit.id}
                  unit={unit}
                  x={pos.x}
                  y={pos.y}
                  isSelected={unit.id === selectedUnitId}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: "#4ade80", boxShadow: "0 0 4px rgba(74, 222, 128, 0.4)" }}
          />
          <span className="font-medium text-foreground">Available</span>
          <span className="text-muted-foreground/70">({availableCount})</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: "#dc2626", boxShadow: "0 0 4px rgba(220, 38, 38, 0.4)" }}
          />
          <span className="font-medium text-foreground">Booked</span>
          <span className="text-muted-foreground/70">({bookedCount})</span>
        </span>
      </div>
    </div>
  );
}
