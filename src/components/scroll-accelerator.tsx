"use client";

import { useEffect } from "react";

const wheelMultiplier = 2.4;

function normalizeWheelDelta(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function findScrollableParent(start: EventTarget | null): HTMLElement | null {
  let element = start instanceof HTMLElement ? start : null;
  while (element && element !== document.body) {
    const style = window.getComputedStyle(element);
    const canScroll = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
    if (canScroll) return element;
    element = element.parentElement;
  }
  return null;
}

export function ScrollAccelerator() {
  useEffect(() => {
    function onWheel(event: WheelEvent) {
      if (event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const delta = normalizeWheelDelta(event);
      if (delta === 0) return;

      const scrollable = findScrollableParent(event.target);
      event.preventDefault();

      if (scrollable) {
        scrollable.scrollBy({ top: delta * wheelMultiplier, behavior: "auto" });
        return;
      }

      window.scrollBy({ top: delta * wheelMultiplier, behavior: "auto" });
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return null;
}
