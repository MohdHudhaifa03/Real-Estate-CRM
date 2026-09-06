import { Link } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { TiltCard } from "@/components/crm/tilt-card";
import { cn } from "@/lib/utils";

/** Number that gently pops whenever its value changes. */
export function AnimatedValue({ value, className }: { value: string; className?: string }) {
  const [shown, setShown] = useState(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value === shown) return;
    setShown(value);
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 340);
    return () => clearTimeout(t);
  }, [value, shown]);

  return (
    <span className={cn("inline-block", pulse && "count-pop", className)} key={shown}>
      {shown}
    </span>
  );
}

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, string>;
  tone?: "primary" | "navy" | "success" | "warning";
}

const tones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/12 text-primary",
  navy: "bg-navy/12 text-navy",
  success: "bg-success/12 text-success",
  warning: "bg-warning/20 text-warning-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  search,
  tone = "primary",
}: StatCardProps) {
  return (
    <TiltCard className="card-sheen overflow-hidden" max={5} lift={8}>
      <Link
        to={to}
        search={search as never}
        className="flex h-full flex-col gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between">
          <span
            className={cn("grid size-10 place-items-center rounded-xl tilt-layer", tones[tone])}
            style={{ ["--tilt-depth" as string]: "26px" }}
          >
            <Icon className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
        <div className="tilt-layer" style={{ ["--tilt-depth" as string]: "14px" }}>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-1 font-serif text-3xl text-foreground">
            <AnimatedValue value={value} />
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </Link>
    </TiltCard>
  );
}
