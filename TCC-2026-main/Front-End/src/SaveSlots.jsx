import { useEffect, useRef, useState } from "react";
import "./SaveSlots.css";

/**
 * Modal com os 8 slots de save (runs salvas automaticamente).
 * Só visual por enquanto — sem lógica de carregar/salvar de verdade.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - slots: Array<Slot | null>   // até 8 posições; null = slot vazio
 * - onSelectSlot: (index: number) => void
 *
 * Slot = {
 *   characterName: string,
 *   chapterLabel: string,     // ex: "Capítulo 3 — A Vila Esquecida"
 *   lastPlayed: string,       // ex: "há 2 dias"
 * }
 */
export default function SaveSlots({ open, onClose, slots = [], onSelectSlot, onDeleteSlot }) {
  const listRef = useRef(null);
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const [thumb, setThumb] = useState({ height: 100, top: 0 });
  const [scrollable, setScrollable] = useState(false);

  const updateThumb = () => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (scrollHeight <= clientHeight + 1) {
      setScrollable(false);
      return;
    }

    setScrollable(true);
    const thumbHeightPct = (clientHeight / scrollHeight) * 100;
    const maxTop = 100 - thumbHeightPct;
    const scrollPct = scrollTop / (scrollHeight - clientHeight);
    setThumb({ height: thumbHeightPct, top: scrollPct * maxTop });
  };

  useEffect(() => {
    if (open) updateThumb();
  }, [open, slots]);

  // Registrado manualmente (em vez de onWheel no JSX) porque o React trata
  // o onWheel do JSX como "passivo", e nesse modo o preventDefault() é
  // ignorado — o que deixava a rolagem nativa (rápida) entrar junto com a
  // nossa versão reduzida.
  useEffect(() => {
    const el = listRef.current;
    if (!el || !open) return;

    const onNativeWheel = (e) => {
      e.preventDefault();
      el.scrollTop += e.deltaY * 0.3;
      updateThumb();
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", onNativeWheel);
  }, [open]);

  const scrollFromClientY = (clientY) => {
    const track = trackRef.current;
    const list = listRef.current;
    if (!track || !list) return;

    const trackRect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - trackRect.top) / trackRect.height));
    list.scrollTop = ratio * (list.scrollHeight - list.clientHeight);
  };

  const handleThumbMouseDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;

    const list = listRef.current;
    const startY = e.clientY;
    const startScrollTop = list.scrollTop;
    // Ajuste esse número pra mudar a sensibilidade do arraste
    // (maior = a barrinha responde mais rápido ao movimento do mouse).
    const dragSpeed = 1.5;

    const handleMouseMove = (moveEvent) => {
      if (!draggingRef.current) return;
      const deltaY = moveEvent.clientY - startY;
      const maxScroll = list.scrollHeight - list.clientHeight;
      list.scrollTop = Math.min(maxScroll, Math.max(0, startScrollTop + deltaY * dragSpeed));
      updateThumb();
    };
    const handleMouseUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTrackClick = (e) => {
    if (e.target !== trackRef.current) return; // não interfere em clique no thumb
    scrollFromClientY(e.clientY);
  };

  if (!open) return null;

  const allSlots = Array.from({ length: 8 }, (_, i) => slots[i] ?? null);

  return (
    <div className="save-slots-overlay">
      <div className="save-slots">
        <div className="save-slots__header">
          <h2 className="save-slots__title">Continuar</h2>
          <button onClick={onClose} aria-label="Fechar" className="save-slots__close">
            ×
          </button>
        </div>

        <div className="save-slots__scroll-wrap">
          <div className="save-slots__grid" ref={listRef} onScroll={updateThumb}>
            {allSlots.map((slot, i) =>
              slot ? (
                <div key={i} className="save-slot save-slot--filled">
                  <button
                    type="button"
                    className="save-slot__delete"
                    aria-label={`Excluir save do slot ${i + 1}`}
                    onClick={(e) => { e.stopPropagation(); onDeleteSlot?.(slot); }}
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    className="save-slot__body"
                    onClick={() => onSelectSlot?.(slot, i)}
                  >
                    <span className="save-slot__index">Slot {i + 1}</span>
                    <span className="save-slot__character">{slot.characterName}</span>
                    <span className="save-slot__chapter">{slot.chapterLabel}</span>
                    <span className="save-slot__time">{slot.lastPlayed}</span>
                  </button>
                </div>
              ) : (
                <div key={i} className="save-slot save-slot--empty">
                  <span className="save-slot__index">Slot {i + 1}</span>
                  <span className="save-slot__empty-label">Vazio</span>
                </div>
              )
            )}
          </div>

          {scrollable && (
            <div
              className="save-slots__scrollbar-track"
              ref={trackRef}
              onMouseDown={handleTrackClick}
            >
              <div
                className="save-slots__scrollbar-thumb"
                style={{ height: `${thumb.height}%`, top: `${thumb.top}%` }}
                onMouseDown={handleThumbMouseDown}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}