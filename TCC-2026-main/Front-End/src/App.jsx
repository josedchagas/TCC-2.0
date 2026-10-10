import { useCallback, useEffect, useMemo, useState } from "react";
import Menu from "./Menu";
import CharacterPanel from "./Characterpanel";
import StatusModal from "./Statusmodal";
import BattleModal from "./Battlemodal";
import StoryPanel from "./Storypanel";
import GameMenu from "./GameMenu";
import { apiFetch, ensureGuestSession } from "./api";
import "./App.css";

const STAT_KEYS = ["forca", "destreza", "inteligencia", "resistencia", "agilidade"];

function chapterLabel(save) {
  return `Capítulo ${save.chapterCurrent} — A Vila Esquecida`;
}

function relativeTime(value) {
  if (!value) return "Ainda não jogado";
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "agora mesmo";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [statusOpen, setStatusOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState("Conectando ao jogo...");
  const [saves, setSaves] = useState([]);
  const [activeSave, setActiveSave] = useState(null);

  const refreshSaves = useCallback(async () => {
    const rows = await apiFetch("/saves");
    setSaves(rows);
    return rows;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await ensureGuestSession();
        const rows = await apiFetch("/saves");
        if (!alive) return;
        setSaves(rows);
        setNotice("");
      } catch (error) {
        if (alive) setNotice(`Não foi possível conectar à API: ${error.message}`);
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const slots = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const save = saves.find((row) => row.slotNumber === index + 1);
    if (!save) return null;
    return {
      ...save,
      chapterLabel: chapterLabel(save),
      lastPlayed: relativeTime(save.lastPlayedAt),
    };
  }), [saves]);

  const openSave = async (save) => {
    try {
      const fullSave = await apiFetch(`/saves/${save.id}`);
      setActiveSave(fullSave);
      setScreen("game");
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const startMostRecent = async () => {
    const latest = [...saves].sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt))[0];
    if (latest) await openSave(latest);
    else setNotice("Escolha um personagem para iniciar sua aventura.");
  };

  const createCharacterSave = async (characterId) => {
    try {
      const occupied = new Set(saves.map((save) => save.slotNumber));
      const slotNumber = Array.from({ length: 8 }, (_, index) => index + 1).find((n) => !occupied.has(n));
      if (!slotNumber) throw new Error("Todos os 8 slots estão ocupados. Exclua um save antes de criar outro.");
      const created = await apiFetch("/saves", {
        method: "POST",
        body: JSON.stringify({ slotNumber, characterId }),
      });
      setSaves((current) => [...current, created].sort((a, b) => a.slotNumber - b.slotNumber));
      setActiveSave(created);
      setScreen("game");
      setNotice("");
    } catch (error) {
      setNotice(error.message);
      throw error;
    }
  };

  const deleteSave = async (save) => {
    if (!save?.id || !window.confirm(`Excluir permanentemente o save de ${save.characterName}?`)) return;
    try {
      await apiFetch(`/saves/${save.id}`, { method: "DELETE" });
      setSaves((current) => current.filter((row) => row.id !== save.id));
      if (activeSave?.id === save.id) {
        setActiveSave(null);
        setScreen("menu");
      }
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const saveCurrentGame = async () => {
    if (!activeSave) return;
    try {
      const updated = await apiFetch(`/saves/${activeSave.id}`, {
        method: "PUT",
        body: JSON.stringify({ characterName: activeSave.characterName }),
      });
      setActiveSave(updated);
      await refreshSaves();
      setNotice("Save atualizado.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const addStatusPoint = async (stat) => {
    if (!activeSave) return;
    try {
      const updated = await apiFetch(`/saves/${activeSave.id}/actions/spend-point`, {
        method: "POST",
        body: JSON.stringify({ stat }),
      });
      setActiveSave(updated);
      await refreshSaves();
    } catch (error) {
      setNotice(error.message);
    }
  };

  if (screen === "menu") {
    return (
      <Menu
        title="A Vila Esquecida"
        subtitle="Uma jornada por terras abandonadas"
        slots={slots}
        notice={booting ? "Conectando ao jogo..." : notice}
        onPlay={startMostRecent}
        onSelectCharacter={createCharacterSave}
        onSelectSlot={openSave}
        onDeleteSlot={deleteSave}
      />
    );
  }

  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, activeSave?.[key] ?? 0]));

  return (
    <div className="app-shell">
      {notice && <p role="status" className="app-notice">{notice}</p>}
      <div className="app-stage">
        <CharacterPanel
          xp={{ current: activeSave?.xpCurrent ?? 0, max: activeSave?.xpMax ?? 100 }}
          hp={{ current: activeSave?.hpCurrent ?? 5, max: activeSave?.hpMax ?? 5 }}
          energy={{ current: activeSave?.energyCurrent ?? 5, max: activeSave?.energyMax ?? 5 }}
          money={activeSave?.money ?? 0}
          inventory={[]}
          equipment={[]}
          statusOpen={statusOpen}
          onToggleStatus={() => setStatusOpen((value) => !value)}
        />

        <StoryPanel
          chapterLabel={activeSave ? chapterLabel(activeSave) : "Capítulo 1 — A Vila Esquecida"}
          progress={{ current: activeSave?.chapterCurrent ?? 1, max: activeSave?.chapterMax ?? 1 }}
          storyText={<p>Você chega à entrada da vila abandonada. O vento carrega um cheiro de fumaça antiga, e ao longe, algo se move entre as ruínas.</p>}
          actions={[
            { id: "explore", label: "Explorar a vila", onClick: () => setNotice("As ações narrativas ainda precisam ser implementadas no servidor.") },
            { id: "fight", label: "Investigar o movimento", onClick: () => setBattleOpen(true) },
          ]}
        />
      </div>

      <StatusModal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        stats={stats}
        availablePoints={activeSave?.availablePoints ?? 0}
        onAddPoint={addStatusPoint}
      />

      <BattleModal
        open={battleOpen}
        onClose={() => setBattleOpen(false)}
        enemyName="Lobo das Sombras"
        playerHp={{ current: activeSave?.hpCurrent ?? 5, max: activeSave?.hpMax ?? 5 }}
        enemyHp={{ current: 45, max: 100 }}
        drops={[]}
      />

      <GameMenu
        onSave={saveCurrentGame}
        onExitToMenu={() => { setScreen("menu"); setNotice(""); }}
      />
    </div>
  );
}
