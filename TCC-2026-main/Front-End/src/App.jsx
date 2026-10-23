import { useCallback, useEffect, useMemo, useState } from "react";
import Menu from "./Menu";
import CharacterPanel from "./Characterpanel";
import StatusModal from "./Statusmodal";
import BattleModal from "./Battlemodal";
import StoryPanel from "./Storypanel";
import GameMenu from "./GameMenu";
import ShopModal from "./ShopModal";
import { apiFetch, ensureGuestSession } from "./api";
import "./App.css";

const STAT_KEYS = ["forca", "destreza", "inteligencia", "resistencia", "agilidade"];

function chapterLabel(save, chapterData) {
  return `Capítulo ${save.chapterCurrent} — ${chapterData?.title ?? "A Vila Esquecida"}`;
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
  const [chapterData, setChapterData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [defeatedEnemies, setDefeatedEnemies] = useState([]);
  const [sideQuests, setSideQuests] = useState([]);
  const [questBusy, setQuestBusy] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [battleBusy, setBattleBusy] = useState(false);
  const [shop, setShop] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopBusy, setShopBusy] = useState(false);

  const refreshSaves = useCallback(async () => {
    const rows = await apiFetch("/saves");
    setSaves(rows);
    return rows;
  }, []);

  const refreshGameData = useCallback(async (save) => {
    if (!save?.id) return;
    const [chapter, inv, eqp, defeated, quests] = await Promise.all([
      apiFetch(`/game/chapters/${save.chapterCurrent}`),
      apiFetch(`/saves/${save.id}/inventory`),
      apiFetch(`/saves/${save.id}/equipment`),
      apiFetch(`/saves/${save.id}/encounters/defeated`),
      apiFetch(`/saves/${save.id}/side-quests`),
    ]);
    setChapterData(chapter);
    setInventory(inv.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, qty: item.quantity })));
    setEquipment(eqp.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, slot: item.slot })));
    setDefeatedEnemies(defeated.filter((code) => !String(code).startsWith("sidequest:")));
    setSideQuests(quests);
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

  useEffect(() => {
    let alive = true;
    if (!activeSave?.id) return undefined;
    refreshGameData(activeSave).catch((error) => { if (alive) setNotice(`Erro ao carregar os dados do jogo: ${error.message}`); });
    return () => { alive = false; };
  }, [activeSave?.id, activeSave?.chapterCurrent, refreshGameData]);

  const slots = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const save = saves.find((row) => row.slotNumber === index + 1);
    if (!save) return null;
    return { ...save, chapterLabel: `Capítulo ${save.chapterCurrent}`, lastPlayed: relativeTime(save.lastPlayedAt) };
  }), [saves]);

  const updateSaveInLists = (updated) => {
    setActiveSave(updated);
    setSaves((current) => current.map((row) => row.id === updated.id ? updated : row));
  };

  const openSave = async (save) => {
    try {
      const fullSave = await apiFetch(`/saves/${save.id}`);
      setActiveSave(fullSave);
      setScreen("game");
      setNotice("");
    } catch (error) { setNotice(error.message); }
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
      const created = await apiFetch("/saves", { method: "POST", body: JSON.stringify({ slotNumber, characterId }) });
      setSaves((current) => [...current, created].sort((a, b) => a.slotNumber - b.slotNumber));
      setActiveSave(created);
      setScreen("game");
      setNotice("");
    } catch (error) { setNotice(error.message); throw error; }
  };

  const deleteSave = async (save) => {
    if (!save?.id || !window.confirm(`Excluir permanentemente o save de ${save.characterName}?`)) return;
    try {
      await apiFetch(`/saves/${save.id}`, { method: "DELETE" });
      setSaves((current) => current.filter((row) => row.id !== save.id));
      if (activeSave?.id === save.id) { setActiveSave(null); setScreen("menu"); }
      setNotice("");
    } catch (error) { setNotice(error.message); }
  };

  const saveCurrentGame = async () => {
    if (!activeSave) return;
    try {
      const updated = await apiFetch(`/saves/${activeSave.id}`, { method: "PUT", body: JSON.stringify({ characterName: activeSave.characterName }) });
      updateSaveInLists(updated);
      await refreshSaves();
      setNotice("Progresso salvo.");
    } catch (error) { setNotice(error.message); }
  };

  const addStatusPoint = async (stat) => {
    if (!activeSave) return;
    try {
      const updated = await apiFetch(`/saves/${activeSave.id}/actions/spend-point`, { method: "POST", body: JSON.stringify({ stat }) });
      updateSaveInLists(updated);
      await refreshSaves();
    } catch (error) { setNotice(error.message); }
  };

  const fightEnemy = async (enemy) => {
    if (!activeSave || battleBusy) return;
    setBattleBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/battle/${encodeURIComponent(enemy.id)}/resolve`, { method: "POST", body: JSON.stringify({}) });
      setBattleResult(result);
      updateSaveInLists(result.save);
      setBattleOpen(true);
      await refreshSaves();
      await refreshGameData(result.save);
      setNotice(result.message);
    } catch (error) { setNotice(error.message); }
    finally { setBattleBusy(false); }
  };

  const openShop = async () => {
    if (!activeSave || !chapterData?.shopAvailable) return;
    try {
      const shopData = await apiFetch(`/game/shops/${activeSave.chapterCurrent}`);
      setShop(shopData);
      setShopOpen(true);
    } catch (error) { setNotice(error.message); }
  };

  const buyItem = async (item) => {
    if (!activeSave || shopBusy) return;
    setShopBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/shop/purchase`, { method: "POST", body: JSON.stringify({ itemCode: item.code, quantity: 1 }) });
      updateSaveInLists(result.save);
      await refreshSaves();
      await refreshGameData(result.save);
      setNotice(result.message);
    } catch (error) { setNotice(error.message); }
    finally { setShopBusy(false); }
  };

  const equipItem = async (item) => {
    if (!activeSave || !item?.itemId) return;
    const slots = item.type === "weapon" ? ["weapon"]
      : item.type === "accessory" ? ["ring"]
      : ["helmet", "chest", "pants", "shield", "boots"];
    const promptText = slots.length === 1
      ? `Digite "${slots[0]}" para equipar ${item.name}.`
      : `Escolha o slot para ${item.name}: ${slots.join(", ")}. Digite exatamente um deles.`;
    const chosen = window.prompt(promptText, slots[0]);
    if (!chosen) return;
    const slot = chosen.trim().toLowerCase();
    if (!slots.includes(slot)) {
      setNotice("Slot inválido para este item.");
      return;
    }
    try {
      const current = equipment.filter((entry) => entry.slot === slot);
      const target = current[0];
      const result = target
        ? await apiFetch(`/saves/${activeSave.id}/equipment/${target.id}`, { method: "PUT", body: JSON.stringify({ itemId: item.itemId }) })
        : await apiFetch(`/saves/${activeSave.id}/equipment`, { method: "POST", body: JSON.stringify({ itemId: item.itemId, slot }) });
      await refreshGameData(activeSave);
      setNotice(target ? `${item.name} equipado; equipamento anterior devolvido ao inventário.` : `${item.name} equipado.`);
    } catch (error) { setNotice(error.message); }
  };

  const unequipItem = async (item) => {
    if (!activeSave || !item?.id) return;
    try {
      await apiFetch(`/saves/${activeSave.id}/equipment/${item.id}`, { method: "DELETE" });
      await refreshGameData(activeSave);
      setNotice(`${item.name} foi devolvido ao inventário.`);
    } catch (error) { setNotice(error.message); }
  };

  const resolveQuest = async (quest, action) => {
    if (!activeSave || questBusy) return;
    setQuestBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/side-quests/${quest.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      if (result.save) updateSaveInLists(result.save);
      await refreshGameData(result.save ?? activeSave);
      if (result.save) await refreshSaves();
      setNotice(result.message);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setQuestBusy(false);
    }
  };

  const useItem = async (item) => {
    if (!activeSave) return;
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/inventory/${item.id}/use`, { method: "POST", body: JSON.stringify({}) });
      updateSaveInLists(result.save);
      await refreshGameData(result.save);
      setNotice(result.message);
    } catch (error) { setNotice(error.message); }
  };

  if (screen === "menu") {
    return <Menu title="A Vila Esquecida" subtitle="Uma jornada por terras abandonadas" slots={slots} notice={booting ? "Conectando ao jogo..." : notice} onPlay={startMostRecent} onSelectCharacter={createCharacterSave} onSelectSlot={openSave} onDeleteSlot={deleteSave} />;
  }

  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, activeSave?.[key] ?? 0]));
  const storyText = activeSave?.completed
    ? <><p>A Fenda foi encerrada e a aurora voltou a Valedouro. O futuro do reino agora depende das escolhas que você fez durante a jornada.</p><p><strong>Campanha concluída.</strong> Você ainda pode revisar seu personagem e os itens encontrados.</p></>
    : <><p>{chapterData?.story ?? "Carregando narrativa..."}</p><p><strong>Objetivo:</strong> {chapterData?.objective ?? ""}</p><p>{chapterData?.encounterText ?? ""}</p></>;
  const actions = activeSave?.completed ? [] : [
    ...(chapterData?.enemies ?? []).map((enemy) => {
      const bossBlocked = enemy.kind === "boss" && chapterData.enemies.some((other) => other.kind !== "boss" && !defeatedEnemies.includes(other.id));
      return { id: enemy.id, label: defeatedEnemies.includes(enemy.id) ? `Derrotado: ${enemy.name}` : bossBlocked ? `Bloqueado: ${enemy.name} (derrote os outros)` : `Enfrentar: ${enemy.name} (+${enemy.gold} moedas)`, disabled: defeatedEnemies.includes(enemy.id) || bossBlocked || battleBusy, onClick: () => fightEnemy(enemy) };
    }),
    ...sideQuests.map((quest) => {
      if (quest.status !== "available") {
        const statusLabel = quest.status === "success" ? "Concluída" : quest.status === "failed" ? "Tentativa encerrada" : "Recusada";
        return { id: quest.id, label: `Missão: ${quest.title} — ${statusLabel}`, disabled: true, onClick: () => {} };
      }
      return {
        id: quest.id,
        label: `Missão opcional: ${quest.title} (atributo: ${quest.attribute}, chance base variável)`,
        disabled: questBusy || battleBusy,
        onClick: () => {
          const accepted = window.confirm(`${quest.title}\\n\\n${quest.description}\\n\\nOK: tentar missão. Cancelar: recusar sem penalidade.`);
          resolveQuest(quest, accepted ? "accept" : "decline");
        },
      };
    }),
    ...(chapterData?.shopAvailable ? [{ id: "shop", label: `Visitar loja: ${chapterData.title}`, onClick: openShop }] : []),
  ];

  return (
    <div className="app-shell">
      {notice && <p role="status" className="app-notice">{notice}</p>}
      <div className="app-stage">
        <CharacterPanel
          xp={{ current: activeSave?.xpCurrent ?? 0, max: activeSave?.xpMax ?? 100 }}
          hp={{ current: activeSave?.hpCurrent ?? 0, max: activeSave?.hpMax ?? 100 }}
          energy={{ current: activeSave?.energyCurrent ?? 0, max: activeSave?.energyMax ?? 50 }}
          money={activeSave?.money ?? 0}
          inventory={inventory}
          equipment={equipment}
          statusOpen={statusOpen}
          onToggleStatus={() => setStatusOpen((value) => !value)}
          onUseItem={useItem}
          onEquipItem={equipItem}
          onUnequipItem={unequipItem}
        />
        <StoryPanel
          chapterLabel={activeSave ? chapterLabel(activeSave, chapterData) : "Capítulo 1 — A Vila Esquecida"}
          progress={{ current: activeSave?.chapterCurrent ?? 1, max: activeSave?.chapterMax ?? 20 }}
          storyText={storyText}
          actions={actions}
        />
      </div>

      <StatusModal open={statusOpen} onClose={() => setStatusOpen(false)} stats={stats} availablePoints={activeSave?.availablePoints ?? 0} onAddPoint={addStatusPoint} />
      <BattleModal
        open={battleOpen}
        onClose={() => setBattleOpen(false)}
        enemyName={battleResult?.enemy?.name ?? "Inimigo"}
        playerHp={{ current: activeSave?.hpCurrent ?? 0, max: activeSave?.hpMax ?? 100 }}
        enemyHp={{ current: battleResult?.enemy?.hpCurrent ?? battleResult?.enemy?.hp ?? 100, max: battleResult?.enemy?.hp ?? 100 }}
        drops={(battleResult?.drops ?? []).filter((drop) => drop.granted).map((drop) => ({ id: drop.code, name: drop.name }))}
        resultText={battleResult?.message ?? ""}
        rewards={battleResult?.rewards ?? null}
        victory={battleResult?.victory ?? null}
      />
      <ShopModal shop={shop} open={shopOpen} onClose={() => setShopOpen(false)} onBuy={buyItem} busy={shopBusy} />
      <GameMenu onSave={saveCurrentGame} onExitToMenu={() => { setScreen("menu"); setNotice(""); }} />
    </div>
  );
}
