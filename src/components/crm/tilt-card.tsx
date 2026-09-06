import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Restrained pointer-responsive 3D tilt.
 * - Fine pointers only (touch and pen fall back to a flat card).
 * - Respects prefers-reduced-motion.
 * - Uses CSS custom properties so children can parallax via `tilt-layer`.
 */
export function useTilt({ max = 6, lift = 10 }: { max?: number; lift?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnabled(!reduced && fine);
  }, []);

  const reset = useCallback(() => {
    setActive(false);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-lift", "0px");
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-x", `${(-py * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-lift", `${lift}px`);
      });
      if (!active) setActive(true);
    },
    [active, enabled, lift, max],
  );

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { ref, enabled, active, onPointerMove, onPointerLeave: reset, onBlur: reset };
}

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  lift?: number;
  interactive?: boolean;
}

export function TiltCard({
  className,
  children,
  max,
  lift,
  interactive = true,
  style,
  ...rest
}: TiltCardProps) {
  const tilt = useTilt({ ...(max !== undefined ? { max } : {}), ...(lift !== undefined ? { lift } : {}) });

  return (
    <div className={cn("tilt-scene", interactive && "cursor-default")}>
      <div
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        onBlur={tilt.onBlur}
        style={style as CSSProperties}
        className={cn(
          "tilt-surface rounded-2xl border border-border/70 bg-card shadow-soft",
          tilt.active && "tilt-active shadow-lift",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
