import { useEffect, useRef } from "react";
import "./Storypanel.css";

/** Log narrativo: apresenta acontecimentos em ordem e decisões da cena atual. */
export default function StoryPanel({ chapterLabel = "Capítulo 1", progress = { current: 1, max: 20 }, storyText = [], actions = [] }) {
  const pct = Math.min(100, (progress.current / progress.max) * 100);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [storyText, actions]);

  return (
    <main className="story-panel">
      <div className="story-panel__header">
        <span className="story-panel__chapter">{chapterLabel}</span>
        <div className="story-panel__progress">
          <div className="story-panel__progress-track">
            <div className="story-panel__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="story-panel__progress-label">{progress.current}/{progress.max}</span>
        </div>
      </div>
      <section className="story-panel__text" ref={logRef} aria-label="História da aventura" aria-live="polite">
        {storyText.length === 0 ? <p className="story-panel__text-empty">A história está se preparando...</p> : storyText.map((entry) => (
          <p key={entry.id} className={"story-panel__entry story-panel__entry--" + (entry.type || "narration")}>{entry.text}</p>
        ))}
      </section>
      {actions.length > 0 && <div className="story-panel__actions" aria-label="Decisões disponíveis">
        {actions.map((action) => <button key={action.id} onClick={action.onClick} disabled={action.disabled} className="story-panel__action-btn">{action.label}</button>)}
      </div>}
    </main>
  );
}
