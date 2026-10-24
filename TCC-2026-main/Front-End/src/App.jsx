import { useCallback, useEffect, useMemo, useState } from "react";
import Menu from "./Menu";
import CharacterPanel from "./Characterpanel";
import StatusModal from "./Statusmodal";
import StoryPanel from "./Storypanel";
import GameMenu from "./GameMenu";
import ShopModal from "./ShopModal";
import { apiFetch, ensureGuestSession } from "./api";
import "./App.css";

const STAT_KEYS = ["forca", "destreza", "inteligencia", "resistencia", "agilidade"];

function chapterLabel(save, chapterData) {
  return `Capítulo ${save.chapterCurrent} — ${chapterData?.title ?? "A Vila Esquecida"}`;
}

const CHAPTER_LOCATIONS = [
  "as vielas de Valedouro",
  "a Estrada dos Corvos",
  "o Bosque das Vozes",
  "a Ponte Partida",
  "o Mercado das Lanternas",
  "as Minas de Vidro",
  "a Abadia Silenciosa",
  "o Pântano dos Nomes",
  "a Torre Afundada",
  "a Praça da Lua Rubra",
  "o Deserto de Cinzas",
  "o Observatório Partido",
  "a Floresta Petrificada",
  "a Cidade Submersa",
  "a Forja dos Juramentos",
  "o Mar Suspenso",
  "o Reino do Avesso",
  "o Cerco da Fenda",
  "o Coração da Estrela",
  "a última fronteira"
];

function chapterLocation(chapter) {
  return CHAPTER_LOCATIONS[Math.max(0, Math.min(CHAPTER_LOCATIONS.length - 1, Number(chapter) - 1))];
}

function sceneNarration(chapter, subject, description, isQuest = false) {
  const place = chapterLocation(chapter);
  const detail = description || "O silêncio ao redor parece esconder algo que ainda não compreendemos.";
  if (isQuest) return [
    `Ao deixar o caminho principal, você percebe sinais recentes de passagem em ${place}.`,
    `Uma pessoa sem nome espera perto de um marco quebrado, tentando esconder o medo sob uma postura firme.`,
    `${detail}`,
    `Ela mostra um objeto ou uma marca que pode explicar parte do mistério, mas não parece disposta a agir sem ajuda.`,
    `A decisão é sua: aceitar o pedido pode revelar uma pista importante, enquanto partir talvez deixe alguém para trás.`,
  ].join("\\n");
  return [
    `O vento muda de direção em ${place}, trazendo um cheiro de terra molhada e metal antigo.`,
    `${detail}`,
    `À frente, ${subject} se move entre as sombras e ocupa a passagem mais segura.`,
    `O som de seus passos cessa; por um instante, até os ruídos distantes parecem desaparecer.`,
    `Não há rota livre sem uma escolha: enfrentar a ameaça ou recuar até encontrar outra oportunidade.`,
  ].join("\\n");
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
  const [booting, setBooting] = useState(true);
  const [notice, setNotice] = useState("Conectando ao jogo...");
  const [saves, setSaves] = useState([]);
  const [activeSave, setActiveSave] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [chapterLoadedForSaveId, setChapterLoadedForSaveId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [defeatedEnemies, setDefeatedEnemies] = useState([]);
  const [sideQuests, setSideQuests] = useState([]);
  const [storyEntries, setStoryEntries] = useState([]);
  const [storyStarted, setStoryStarted] = useState(false);
  const [visitedShopChapters, setVisitedShopChapters] = useState([]);
  const [questBusy, setQuestBusy] = useState(false);
  const [battleBusy, setBattleBusy] = useState(false);
  const [shop, setShop] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopBusy, setShopBusy] = useState(false);


  const currentEvent = useMemo(() => {
    if (!activeSave || activeSave.completed || !chapterData || chapterLoadedForSaveId !== activeSave.id || chapterData.number !== activeSave.chapterCurrent || !storyStarted) return null;
    if (chapterData.shopAvailable && !visitedShopChapters.includes(chapterData.number)) {
      return {
        key: "c" + String(chapterData.number).padStart(2, "0") + ":shop",
        type: "shop",
        intro: "A trilha desemboca em um pequeno ponto de comércio. Suprimentos podem fazer a diferença entre sobreviver e cair no próximo confronto.",
        dialogue: "— Tenho provisões para quem ainda pretende seguir viagem — diz a comerciante. — Quer olhar meus produtos ou prefere continuar?",
      };
    }
    const quests = [...sideQuests].sort((a, b) => a.id.localeCompare(b.id));
    const enemies = chapterData.enemies ?? [];
    const ordinaryEnemies = enemies.filter((enemy) => enemy.kind !== "boss");
    const boss = enemies.find((enemy) => enemy.kind === "boss");
    const sequence = [
      quests[0] && {
        key: quests[0].id, type: "quest", quest: quests[0],
        intro: sceneNarration(chapterData.number, quests[0].title, quests[0].description, true),
        dialogue: "— Não posso resolver isso sem ajuda — diz a pessoa, mantendo a voz baixa. — Você aceita me ajudar ou prefere seguir viagem?",
      },
      ordinaryEnemies[0] && {
        key: ordinaryEnemies[0].id, type: "enemy", enemy: ordinaryEnemies[0],
        intro: sceneNarration(chapterData.number, ordinaryEnemies[0].name, ordinaryEnemies[0].description || chapterData.encounterText),
        dialogue: "A criatura inclina o corpo e observa cada movimento seu. Se quiser continuar, terá de decidir como reagir.",
      },
      quests[1] && {
        key: quests[1].id, type: "quest", quest: quests[1],
        intro: sceneNarration(chapterData.number, quests[1].title, quests[1].description, true),
        dialogue: "— O tempo está acabando — diz a pessoa, olhando para a trilha atrás de você. — Ainda posso contar com sua ajuda?",
      },
      ordinaryEnemies[1] && {
        key: ordinaryEnemies[1].id, type: "enemy", enemy: ordinaryEnemies[1],
        intro: sceneNarration(chapterData.number, ordinaryEnemies[1].name, ordinaryEnemies[1].description || chapterData.encounterText),
        dialogue: "A passagem fica bloqueada e a criatura avança um passo. O próximo movimento determinará se você seguirá adiante.",
      },
      boss && {
        key: boss.id, type: "enemy", enemy: boss,
        intro: sceneNarration(chapterData.number, boss.name, boss.description || chapterData.encounterText),
        dialogue: "Uma voz grave rompe o silêncio: — Você chegou até aqui. Agora terá de provar que consegue atravessar esta última barreira.",
      },
    ].filter(Boolean);
    return sequence.find((event) => {
      if (event.type === "quest") return event.quest.status === "available";
      if (event.type === "enemy") return !defeatedEnemies.includes(event.enemy.id);
      return false;
    }) ?? null;
  }, [activeSave, chapterData, chapterLoadedForSaveId, storyStarted, visitedShopChapters, sideQuests, defeatedEnemies]);

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
    setChapterLoadedForSaveId(save.id);
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
    setStoryEntries([]);
    setStoryStarted(false);
    setVisitedShopChapters([]);
    setChapterData(null);
    setChapterLoadedForSaveId(null);
    setSideQuests([]);
    setDefeatedEnemies([]);
  }, [activeSave?.id]);

  useEffect(() => {
    setStoryStarted(false);
  }, [activeSave?.chapterCurrent]);

  useEffect(() => {
    if (!activeSave?.id || chapterLoadedForSaveId !== activeSave.id || !chapterData || chapterData.number !== activeSave.chapterCurrent) return;
    const storyId = "chapter-" + chapterData.number + "-story";
    setStoryEntries((entries) => {
      if (entries.some((entry) => entry.id === storyId)) return entries;
      return [
        ...entries,
        { id: storyId, type: "narration", text: chapterData.story },
        { id: "chapter-" + chapterData.number + "-objective", type: "objective", text: "Objetivo: " + chapterData.objective },
      ];
    });
  }, [activeSave?.id, activeSave?.chapterCurrent, chapterData, chapterLoadedForSaveId]);

  useEffect(() => {
    if (!storyStarted || !currentEvent) return;
    setStoryEntries((entries) => {
      if (entries.some((entry) => entry.id === "event-" + currentEvent.key)) return entries;
      return [
        ...entries,
        { id: "event-" + currentEvent.key, type: "narration", text: currentEvent.intro },
        ...(currentEvent.dialogue ? [{ id: "dialogue-" + currentEvent.key, type: "dialogue", text: currentEvent.dialogue }] : []),
      ];
    });
  }, [storyStarted, currentEvent]);

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
      updateSaveInLists(result.save);
      const stamp = Date.now();
      const lines = [{ id: `battle-${enemy.id}-${stamp}`, type: "outcome", text: result.message }];
      if (result.victory && result.rewards) {
        lines.push({ id: `battle-reward-${enemy.id}-${stamp}`, type: "outcome", text: `Recompensas: +${result.rewards.xp} XP e +${result.rewards.gold} moedas${result.rewards.levelsGained ? `; níveis ganhos: ${result.rewards.levelsGained}` : ""}.` });
      }
      const drops = (result.drops ?? []).filter((drop) => drop.granted).map((drop) => drop.name);
      if (drops.length) lines.push({ id: `battle-drops-${enemy.id}-${stamp}`, type: "outcome", text: `Você encontrou: ${drops.join(", ")}.` });
      setStoryEntries((entries) => [...entries, ...lines]);
      await refreshSaves();
      await refreshGameData(result.save);
      setNotice("");
    } catch (error) {
      setStoryEntries((entries) => [...entries, { id: "battle-error-" + Date.now(), type: "outcome", text: error.message }]);
    } finally {
      setBattleBusy(false);
    }
  };

  const openShop = async () => {
    if (!activeSave || !chapterData?.shopAvailable) return;
    try {
      const shopData = await apiFetch(`/game/shops/${activeSave.chapterCurrent}`);
      setShop(shopData);
      setVisitedShopChapters((chapters) => chapters.includes(activeSave.chapterCurrent) ? chapters : [...chapters, activeSave.chapterCurrent]);
      setStoryEntries((entries) => [...entries, { id: "shop-" + activeSave.chapterCurrent + "-" + Date.now(), type: "outcome", text: "Você decide examinar os suprimentos antes de seguir viagem." }]);
      setShopOpen(true);
    } catch (error) { setNotice(error.message); }
  };

  const buyItem = async (item) => {
    if (!activeSave || shopBusy) return;
    setShopBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/shop/purchase`, { method: "POST", body: JSON.stringify({ itemCode: item.code, quantity: 1 }) });
      updateSaveInLists(result.save);
      setStoryEntries((entries) => [...entries, { id: "purchase-" + Date.now(), type: "outcome", text: result.message }]);
      await refreshSaves();
      await refreshGameData(result.save);
      setNotice("");
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
      const stamp = Date.now();
      setStoryEntries((entries) => [...entries, { id: `quest-result-${quest.id}-${stamp}`, type: "outcome", text: result.message }]);
      if (result.reward) {
        const details = `Recompensas: +${result.reward.xp} XP e +${result.reward.gold} moedas${result.reward.itemGranted ? `; item recebido: ${result.reward.item}` : ""}.`;
        setStoryEntries((entries) => [...entries, { id: `quest-reward-${quest.id}-${stamp}`, type: "outcome", text: details }]);
      }
      await refreshGameData(result.save ?? activeSave);
      if (result.save) await refreshSaves();
      setNotice("");
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
      setStoryEntries((entries) => [...entries, { id: "use-item-" + Date.now(), type: "outcome", text: result.message }]);
      await refreshGameData(result.save);
      setNotice("");
    } catch (error) { setNotice(error.message); }
  };

  if (screen === "menu") {
    return <Menu title="A Vila Esquecida" subtitle="Uma jornada por terras abandonadas" slots={slots} notice={booting ? "Conectando ao jogo..." : notice} onPlay={startMostRecent} onSelectCharacter={createCharacterSave} onSelectSlot={openSave} onDeleteSlot={deleteSave} />;
  }

  const stats = Object.fromEntries(STAT_KEYS.map((key) => [key, activeSave?.[key] ?? 0]));
  const storyText = activeSave?.completed
    ? [
        { id: "ending", type: "narration", text: "A Fenda foi encerrada e a aurora voltou a Valedouro. O futuro do reino agora depende das escolhas que você fez durante a jornada." },
        { id: "ending-note", type: "outcome", text: "Campanha concluída. Você ainda pode revisar seu personagem e os itens encontrados." },
      ]
    : storyEntries;

  const actions = activeSave?.completed ? [] : !storyStarted
    ? [{ id: "continue-intro", label: "Continuar a história", disabled: chapterLoadedForSaveId !== activeSave?.id || !chapterData || storyEntries.length === 0, onClick: () => {
        setStoryStarted(true);
        setStoryEntries((entries) => [...entries, { id: "chapter-" + activeSave.chapterCurrent + "-path-" + Date.now(), type: "narration", text: [`Você deixa para trás o último abrigo e entra em ${chapterLocation(chapterData.number)}.`, chapterData?.encounterText || "A paisagem guarda sinais de uma ameaça antiga.", "O caminho se estreita e o silêncio torna cada ruído mais próximo.", "Marcas recentes no chão indicam que alguém passou por ali pouco antes de você.", "Você respira fundo e segue, sabendo que a próxima decisão pode mudar o rumo da jornada."].join("\\n") }]);
      } }]
    : currentEvent?.type === "quest"
      ? [
          { id: currentEvent.key + "-accept", label: "Aceitar missão", disabled: questBusy, onClick: () => resolveQuest(currentEvent.quest, "accept") },
          { id: currentEvent.key + "-decline", label: "Fugir e seguir caminho", disabled: questBusy, onClick: () => resolveQuest(currentEvent.quest, "decline") },
        ]
      : currentEvent?.type === "enemy"
        ? [
            { id: currentEvent.key + "-fight", label: "Enfrentar " + currentEvent.enemy.name, disabled: battleBusy || (activeSave?.hpCurrent ?? 0) <= 0, onClick: () => fightEnemy(currentEvent.enemy) },
            { id: currentEvent.key + "-flee", label: "Recuar por enquanto", disabled: battleBusy, onClick: () => setStoryEntries((entries) => [...entries, { id: "flee-" + currentEvent.key + "-" + Date.now(), type: "outcome", text: "Você recua para manter distância de " + currentEvent.enemy.name + ". O caminho continua bloqueado; será preciso voltar e enfrentar o perigo para avançar." }]) },
          ]
        : currentEvent?.type === "shop"
          ? [
              { id: "open-shop", label: "Visitar a loja", onClick: openShop },
              { id: "skip-shop", label: "Seguir sem comprar", onClick: () => {
                  setVisitedShopChapters((chapters) => chapters.includes(activeSave.chapterCurrent) ? chapters : [...chapters, activeSave.chapterCurrent]);
                  setStoryEntries((entries) => [...entries, { id: "skip-shop-" + activeSave.chapterCurrent + "-" + Date.now(), type: "outcome", text: "Você agradece pela oferta e continua a viagem sem comprar suprimentos." }]);
                } },
            ]
          : [];

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
      <ShopModal shop={shop} open={shopOpen} onClose={() => setShopOpen(false)} onBuy={buyItem} busy={shopBusy} />
      <GameMenu onSave={saveCurrentGame} onExitToMenu={() => { setScreen("menu"); setNotice(""); }} />
    </div>
  );
}
