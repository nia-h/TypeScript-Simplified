import type { Event } from "../context/Events";
import { Key, ReactNode, useLayoutEffect, useRef, useState } from "react";

type OverflowContainerProps = {
  items: Event[];
  renderItem: (item: Event) => ReactNode;
  renderOverflow: (overflowAmount: number) => ReactNode;
  className?: string;
  //   getKey: (item: T) => Key;
};

export function OverflowContainer({
  items,
  renderItem,
  renderOverflow,
  //   getKey,
  className,
}: OverflowContainerProps) {
  const [overflowAmount, setOverflowAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getKey = (a: Event) => a.id as Key;

  useLayoutEffect(() => {
    if (containerRef.current === null) return;

    const observer = new ResizeObserver(entries => {
      const containerElement = entries[0]?.target;
      if (containerElement === null) return;

      const children = containerElement.querySelectorAll<HTMLElement>("[data-item]");
      const overflowElement =
        containerElement.parentElement?.querySelector<HTMLElement>(
          "[data-overflow]"
        );
      if (overflowElement != null) overflowElement.style.display = "none";
      children.forEach(child => child.style.removeProperty("display"));
      let amount = 0;
      for (let i = children.length - 1; i >= 0; i--) {
        let child = children[i];
        if (containerElement.scrollHeight <= containerElement.clientHeight) break;

        child.style.display = "none";
        overflowElement?.style.removeProperty("display");
        amount = children.length - i;
      }
      setOverflowAmount(amount);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <div ref={containerRef} className={className}>
        {items.map(item => (
          <div data-item key={getKey(item)}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      <div data-overflow>{renderOverflow(overflowAmount)}</div>
    </>
  );
}
