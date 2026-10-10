import { useState } from "react";
import "./CharacterSelect.css";

// Dados de exemplo só pra visualização — troque pelos personagens reais depois.
const EXAMPLE_CHARACTERS = [
  {
    id: "elyra",
    name: "Elyra",
    role: "Arqueira",
    description: "Ágil e precisa, prefere resolver problemas à distância.",
    stats: { forca: 6, destreza: 16, inteligencia: 9, resistencia: 8, agilidade: 14 },
  },
  {
    id: "bram",
    name: "Bram",
    role: "Guerreiro",
    description: "Um escudo humano — resistente, direto, sem paciência pra encrenca.",
    stats: { forca: 15, destreza: 8, inteligencia: 6, resistencia: 17, agilidade: 7 },
  },
  {
    id: "sora",
    name: "Sora",
    role: "Maga",
    description: "Estudiosa de arcanos antigos, frágil mas devastadora à distância.",
    stats: { forca: 5, destreza: 9, inteligencia: 18, resistencia: 6, agilidade: 10 },
  },
  {
    id: "toren",
    name: "Toren",
    role: "Ladino",
    description: "Rápido, sorrateiro, sempre com uma saída de emergência no bolso.",
    stats: { forca: 8, destreza: 15, inteligencia: 11, resistencia: 9, agilidade: 16 },
  },
];

const STAT_LABELS = {
  forca: "Força",
  destreza: "Destreza",
  inteligencia: "Inteligência",
  resistencia: "Resistência",
  agilidade: "Agilidade",
};

/**
 * Janela (modal) de seleção de personagem — no estilo da tela de saves.
 * Só visual por enquanto — sem lógica de criar/carregar de verdade.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - characters: Array<Character>   // usa EXAMPLE_CHARACTERS se não passar nada
 * - onConfirm: (characterId: string) => void
 */
export default function CharacterSelect({
  open,
  onClose,
  characters = EXAMPLE_CHARACTERS,
  onConfirm,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  if (!open) return null;

  const shownId = hoveredId ?? selectedId;
  const shown = characters.find((c) => c.id === shownId);

  return (
    <div className="char-select-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="char-select">
        <div className="char-select__header">
          <h2 className="char-select__title">Seleção de Personagem</h2>
          <button onClick={onClose} aria-label="Fechar" className="char-select__close">
            ×
          </button>
        </div>

        <div className="char-select__body">
          <div className="char-select__avatars">
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`char-select__avatar-btn ${c.id === selectedId ? "char-select__avatar-btn--selected" : ""}`}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(c.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="char-select__avatar-circle">{c.name.charAt(0)}</span>
                <span className="char-select__avatar-name">{c.name}</span>
              </button>
            ))}
          </div>

          <div className="char-select__sheet">
            {shown ? (
              <>
                <div className="char-select__sheet-header">
                  <span className="char-select__sheet-avatar">{shown.name.charAt(0)}</span>
                  <div>
                    <p className="char-select__sheet-name">{shown.name}</p>
                    <p className="char-select__sheet-role">{shown.role}</p>
                  </div>
                </div>

                <p className="char-select__sheet-desc">{shown.description}</p>

                <div className="char-select__stats">
                  {Object.entries(shown.stats).map(([key, value]) => (
                    <div key={key} className="char-select__stat-row">
                      <span className="char-select__stat-label">{STAT_LABELS[key]}</span>
                      <div className="char-select__stat-track">
                        <div
                          className="char-select__stat-fill"
                          style={{ width: `${Math.min(100, (value / 20) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="char-select__sheet-empty">Passe o mouse sobre um personagem para ver a ficha.</p>
            )}
          </div>
        </div>

        <div className="char-select__actions">
          <button
            type="button"
            className="char-select__confirm-btn"
            disabled={!selectedId}
            onClick={() => onConfirm?.(selectedId)}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}