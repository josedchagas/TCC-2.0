import { useCallback, useEffect, useRef, useState } from "react";
import "./ScrollArea.css";

/** Área rolável com indicador visual próprio, inclusive em navegadores móveis. */
export default function ScrollArea({ as: Tag = "div", className = "", children, scrollToBottomKey, ...props }) {
  const viewportRef = useRef(null);
  const [thumb, setThumb] = useState({ height: 100, top: 0, visible: false });

  const updateThumb = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const visible = scrollHeight > clientHeight + 1;
    const height = visible ? Math.max(12, (clientHeight / scrollHeight) * 100) : 100;
    const top = visible ? (scrollTop / (scrollHeight - clientHeight)) * (100 - height) : 0;
    setThumb({ height, top, visible });
  }, []);

  useEffect(() => {
    if (scrollToBottomKey === undefined) return;
    const element = viewportRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [scrollToBottomKey]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    updateThumb();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateThumb) : null;
    observer?.observe(element);
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    window.addEventListener("resize", updateThumb);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateThumb);
    };
  }, [children, updateThumb]);

  return (
    <div className="custom-scroll-area">
      <Tag
        {...props}
        ref={viewportRef}
        className={`custom-scroll-area__viewport ${className}`.trim()}
        onScroll={(event) => {
          props.onScroll?.(event);
          updateThumb();
        }}
      >
        {children}
      </Tag>
      {thumb.visible && (
        <div className="custom-scroll-area__track" aria-hidden="true">
          <div
            className="custom-scroll-area__thumb"
            style={{ height: `${thumb.height}%`, top: `${thumb.top}%` }}
          />
        </div>
      )}
    </div>
  );
}
