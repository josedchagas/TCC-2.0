import "./Storypanel.css";
 
/**
 * Painel central: progresso na história + texto da narrativa + ações disponíveis.
 * Props:
 * - chapterLabel: string
 * - progress: { current, max }
 * - storyText: string | ReactNode
 * - actions: Array<{ id, label, onClick, disabled? }>
 */
export default function StoryPanel({
  chapterLabel = "Capítulo 1",
  progress = { current: 1, max: 10 },
  storyText,
  actions = [],
}) {
  const pct = Math.min(100, (progress.current / progress.max) * 100);
 
  return (
    <main className="story-panel">
      {/* Progresso na história */}
      <div className="story-panel__header">
        <span className="story-panel__chapter">{chapterLabel}</span>
        <div className="story-panel__progress">
          <div className="story-panel__progress-track">
            <div className="story-panel__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="story-panel__progress-label">
            {progress.current}/{progress.max}
          </span>
        </div>
      </div>
 
      {/* Texto da história */}
      <div className="story-panel__text">
        {storyText ?? <p className="story-panel__text-empty">A história ainda não começou...</p>}
      </div>
 
      {/* Ações */}
      <div className="story-panel__actions">
        {actions.length === 0 ? (
          <span className="story-panel__actions-empty">nenhuma ação disponível</span>
        ) : (
          actions.map((a) => (
            <button
              key={a.id}
              onClick={a.onClick}
              disabled={a.disabled}
              className="story-panel__action-btn"
            >
              {a.label}
            </button>
          ))
        )}
      </div>
    </main>
  );
}
 