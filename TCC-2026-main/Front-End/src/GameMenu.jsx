import { useState } from "react";
import "./GameMenu.css";

/**
 * Botão de menu (☰) que fica visível durante o jogo, mais a janelinha
 * de pausa que ele abre (Salvar / Sair / Voltar).
 *
 * Props:
 * - onSave: () => void        // opcional — por enquanto só visual
 * - onExitToMenu: () => void  // chamado quando o jogador clica em "Sair"
 */
export default function GameMenu({ onSave, onExitToMenu }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="game-menu-btn"
        aria-label="Abrir menu de pausa"
        onClick={() => setOpen(true)}
      >
        <span className="game-menu-btn__bar" />
        <span className="game-menu-btn__bar" />
        <span className="game-menu-btn__bar" />
      </button>

      {open && (
        <div className="game-menu-overlay">
          <div className="game-menu">
            <h2 className="game-menu__title">Menu</h2>

            <div className="game-menu__options">
              <button
                type="button"
                className="game-menu__option"
                onClick={() => {
                  onSave?.();
                }}
              >
                Salvar
              </button>
              <button
                type="button"
                className="game-menu__option game-menu__option--secondary"
                onClick={() => setOpen(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="game-menu__option game-menu__option--danger"
                onClick={() => {
                  setOpen(false);
                  onExitToMenu?.();
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}