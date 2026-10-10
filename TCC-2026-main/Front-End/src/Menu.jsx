import { useState } from "react";
import SaveSlots from "./SaveSlots";
import CharacterSelect from "./CharacterSelect";
import "./Menu.css";

export default function Menu({
  title = "Nome do Jogo",
  subtitle,
  slots = [],
  notice = "",
  onPlay,
  onSelectCharacter,
  onSelectSlot,
  onDeleteSlot,
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);
  const [charSelectOpen, setCharSelectOpen] = useState(false);

  const handlePlay = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      if (slots.some(Boolean)) onPlay?.();
      else setCharSelectOpen(true);
    }, 400);
  };

  return (
    <div className={`menu ${isExiting ? "menu--exiting" : ""}`}>
      <div className="menu__vignette" />
      <div className="menu__content">
        <h1 className="menu__title">{title}</h1>
        {subtitle && <p className="menu__subtitle">{subtitle}</p>}
        <div className="menu__divider" />
        {notice && <p role="status" className="menu__subtitle">{notice}</p>}
        <div className="menu__buttons">
          <button type="button" className="menu__btn menu__btn--primary" onClick={handlePlay}>
            Jogar
          </button>
          <button type="button" className="menu__btn menu__btn--secondary" onClick={() => setSavesOpen(true)}>
            Continuar
          </button>
          <button type="button" className="menu__btn menu__btn--secondary" onClick={() => setCharSelectOpen(true)}>
            Seleção de Personagem
          </button>
        </div>
      </div>

      <SaveSlots
        open={savesOpen}
        onClose={() => setSavesOpen(false)}
        slots={slots}
        onSelectSlot={(slot) => {
          setSavesOpen(false);
          onSelectSlot?.(slot);
        }}
        onDeleteSlot={(slot) => onDeleteSlot?.(slot)}
      />

      <CharacterSelect
        open={charSelectOpen}
        onClose={() => setCharSelectOpen(false)}
        onConfirm={async (characterId) => {
          try {
            await onSelectCharacter?.(characterId);
            setCharSelectOpen(false);
          } catch {
            // O App exibe o erro na tela; mantém o modal aberto para nova tentativa.
          }
        }}
      />
    </div>
  );
}
