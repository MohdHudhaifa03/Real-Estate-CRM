import { useMemo } from "react";

import type { Unit } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

const statusFill: Record<Unit["status"], string> = {
  available: "var(--success)",
  reserved: "var(--warning)",
  sold: "var(--muted-foreground)",
};

/**
 * Stylised master site plan. Units are laid out per block on an illustrated
 * plot so the plan doubles as an interactive availability map.
 */
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
  const grouped = useMemo(
    () => blocks.map((block) => ({ block, items: units.filter((u) => u.block === block) })),
    [blocks, units],
  );

  const cols = 5;
  const cell = 52;
  const gap = 10;
  const blockWidth = cols * cell + (cols - 1) * gap;

  return (
    <div className="tilt-scene">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-sand/50 p-4 shadow-soft">
        <svg
          role="img"
          aria-label="Master site plan with unit availability"
          viewBox={`0 0 ${blockWidth + 80} ${grouped.length * 240 + 40}`}
          className="h-auto w-full min-w-[520px]"
        >
          <defs>
            <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--sand)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
            <filter id="plateShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dy="6"
                stdDeviation="6"
                floodColor="var(--navy)"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          <rect
            x="0"
            y="0"
            width={blockWidth + 80}
            height={grouped.length * 240 + 40}
            rx="18"
            fill="url(#ground)"
          />
          {/* illustrated landscaping */}
          <g opacity="0.5">
            <path
              d={`M20 ${grouped.length * 240 + 10} Q ${(blockWidth + 80) / 2} ${grouped.length * 240 - 40} ${blockWidth + 60} ${grouped.length * 240 + 10}`}
              stroke="var(--primary)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 8"
            />
          </g>

          {grouped.map((group, gi) => {
            const top = 30 + gi * 240;
            return (
              <g key={group.block}>
                <rect
                  x="24"
                  y={top}
                  width={blockWidth + 32}
                  height="196"
                  rx="16"
                  fill="var(--card)"
                  filter="url(#plateShadow)"
                />
                <text
                  x="40"
                  y={top + 28}
                  fill="var(--muted-foreground)"
                  fontSize="13"
                  letterSpacing="2"
                >
                  {group.block.toUpperCase()}
                </text>
                {group.items.map((unit, i) => {
                  const col = i % cols;
                  const row = Math.floor(i / cols);
                  const x = 40 + col * (cell + gap);
                  const y = top + 44 + row * (cell + gap);
                  const selected = unit.id === selectedUnitId;
                  return (
                    <g
                      key={unit.id}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => onSelect(unit)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${unit.code} — ${unit.status}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onSelect(unit);
                      }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={cell}
                        height={cell}
                        rx="10"
                        fill={statusFill[unit.status]}
                        fillOpacity={unit.status === "available" ? 0.22 : 0.3}
                        stroke={selected ? "var(--primary)" : statusFill[unit.status]}
                        strokeWidth={selected ? 3 : 1.5}
                      />
                      <text
                        x={x + cell / 2}
                        y={y + cell / 2 + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--foreground)"
                      >
                        {unit.code}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["available", "reserved", "sold"] as Unit["status"][]).map((s) => (
          <span key={s} className="flex items-center gap-2 capitalize">
            <span
              className={cn("size-3 rounded-sm")}
              style={{ backgroundColor: statusFill[s], opacity: 0.45 }}
            />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
