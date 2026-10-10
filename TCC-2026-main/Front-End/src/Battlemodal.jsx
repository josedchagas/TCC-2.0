import "./BattleModal.css";

/**
 * Tela de batalha, sobreposta ao centro da tela.
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - enemyName: string
 * - playerHp: { current, max }
 * - enemyHp: { current, max }
 * - drops: Array<{ id, icon, name }>
 * - sceneUrl: string (arte da luta, opcional)
 */
export default function BattleModal({
  open,
  onClose,
  enemyName = "Inimigo",
  playerHp = { current: 0, max: 100 },
  enemyHp = { current: 0, max: 100 },
  drops = [],
  sceneUrl,
}) {
  if (!open) return null;

  return (
    <div className="battle-modal-overlay">
      <div className="battle-modal">
        <div className="battle-modal__header">
          <h2 className="battle-modal__title">Batalha — {enemyName}</h2>
          <button onClick={onClose} aria-label="Fechar batalha" className="battle-modal__close">
            ×
          </button>
        </div>

        <div className="battle-modal__scene">
          {sceneUrl ? (
            <img src={sceneUrl} alt="Cena da luta" className="battle-modal__scene-img" />
          ) : (
            <span className="battle-modal__scene-empty">cena da luta</span>
          )}
        </div>

        <div className="battle-modal__healthbars">
          <HealthBar label="Jogador" hp={playerHp} />
          <HealthBar label={enemyName} hp={enemyHp} align="right" />
        </div>

        <div className="battle-modal__drops-section">
          <h3 className="battle-modal__drops-title">Drops</h3>
          <div className="battle-modal__drops-box">
            {drops.length === 0 ? (
              <span className="battle-modal__drops-empty">nada ainda</span>
            ) : (
              drops.map((d) => (
                <div key={d.id} className="battle-modal__drop-item">
                  {d.icon && <img src={d.icon} alt={d.name} className="battle-modal__drop-icon" />}
                  <span>{d.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ label, hp, align = "left" }) {
  const pct = Math.min(100, (hp.current / hp.max) * 100);
  return (
    <div className={align === "right" ? "health-bar--right" : ""}>
      <div className="health-bar__track">
        <div
          className={`health-bar__fill ${align === "right" ? "health-bar__fill--right" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`health-bar__label ${align === "right" ? "health-bar__label--enemy" : "health-bar__label--player"}`}>
        {label}
      </p>
    </div>
  );
}