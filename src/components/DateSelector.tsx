import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { nextDays } from '../utils/date';
import { haptics } from '../telegram/haptics';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (iso: string) => void;
}

const DRAG_THRESHOLD = 6;

const days = nextDays(14);

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false, pointerId: 0 });

  // Desktop mice only scroll vertically; without this the strip is stuck
  // for anyone without a touchpad or a Telegram phone.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Click-and-drag scrolling for mouse users (touch already scrolls natively).
  // Pointer capture is only engaged once real dragging is detected — grabbing
  // it eagerly on pointerdown would steal the click from whichever date card
  // is underneath, making every date look unclickable.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = {
      down: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;

    if (!drag.current.moved) {
      if (Math.abs(dx) <= DRAG_THRESHOLD) return;
      drag.current.moved = true;
      el.setPointerCapture(drag.current.pointerId);
    }

    el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    const el = scrollerRef.current;
    if (el && drag.current.moved && el.hasPointerCapture(drag.current.pointerId)) {
      el.releasePointerCapture(drag.current.pointerId);
    }
    drag.current.down = false;
  };

  return (
    <div className="min-w-0 pb-6">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="no-scrollbar flex cursor-grab snap-x snap-proximity gap-2.5 overflow-x-auto px-5 pb-1 active:cursor-grabbing"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
        }}
      >
        {days.map((day) => {
          const active = day.iso === selectedDate;
          return (
            <motion.button
              key={day.iso}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (drag.current.moved) {
                  drag.current.moved = false;
                  return;
                }
                haptics.selection();
                onSelect(day.iso);
              }}
              className={`flex min-h-[64px] w-14 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
                active
                  ? 'border-accent bg-accent-soft'
                  : 'border-border bg-surface active:bg-surface-2'
              }`}
            >
              <span className="text-[11px] uppercase text-text-muted">
                {day.isToday ? 'Сег.' : day.weekday}
              </span>
              <span className="text-lg font-semibold text-text">{day.dayNum}</span>
              <span className="text-[11px] text-text-faint">{day.month}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
