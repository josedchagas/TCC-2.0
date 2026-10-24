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
  "Valedouro", "o Passo dos Corvos", "o Bosque de Miravéu", "a Ponte de Salmour",
  "Miralume", "as Minas de Vidro", "a Abadia de Santa Véspera", "o Pântano de Namar",
  "a Torre de Horolog", "a Praça da Lua Rubra", "as Dunas de Cinza", "o Observatório de Arquen",
  "a Floresta Petrificada de Elarion", "a cidade soterrada de Asterion", "a Forja de Vhal",
  "o Mar Suspenso de Nimbária", "o Reino do Avesso", "o Bastião da Fenda",
  "o Coração da Estrela", "as fronteiras de Valedouro"
];

const CHAPTER_CHARACTERS = [
  { name: "Maelis", role: "cartógrafa sobrevivente de Valedouro", motive: "encontrar os moradores desaparecidos e recuperar o sino enterrado" },
  { name: "Tovan", role: "cocheiro que perdeu a irmã na estrada", motive: "descobrir quem ensinou os corvos a repetir vozes humanas" },
  { name: "Iria", role: "herborista que conhece os caminhos de Miravéu", motive: "impedir que a raiz corrompida roube as lembranças da floresta" },
  { name: "Bram", role: "antigo engenheiro da Ponte de Salmour", motive: "reabrir a passagem antes que os mercenários a destruam" },
  { name: "Nara", role: "mercadora de Miralume, conhecida por cumprir a palavra", motive: "derrubar a guilda que mantém a cidade sob contratos de medo" },
  { name: "Dália", role: "mineira presa entre os cristais", motive: "desligar o núcleo antes que ele parta a montanha" },
  { name: "Irmão Cael", role: "guardião ferido da Abadia de Santa Véspera", motive: "proteger o mapa celeste dos acólitos corrompidos" },
  { name: "Sena", role: "barqueira que atravessa Namar desde criança", motive: "chegar ao outro lado sem entregar nomes às vozes do pântano" },
  { name: "Oren", role: "relojoeiro preso num minuto que se repete", motive: "romper o ciclo que mantém a torre presa no passado" },
  { name: "Nara", role: "mercadora infiltrada no festival", motive: "desmascarar o conselheiro que não projeta sombra" },
  { name: "Samir", role: "guia de uma caravana perdida", motive: "encontrar água e levar os sobreviventes até o observatório" },
  { name: "Liora", role: "astrônoma que se recusou a abandonar Arquen", motive: "descobrir a fraqueza da prisão antes que ela perceba quem a observa" },
  { name: "Eron", role: "guardião das memórias da floresta", motive: "libertar as lembranças roubadas dos habitantes de Valedouro" },
  { name: "Aveline", role: "última arquivista de Asterion", motive: "revelar quem construiu a prisão ao redor da estrela" },
  { name: "Varek", role: "ferreiro que carrega um juramento antigo", motive: "forjar uma arma capaz de atingir o núcleo da Fenda" },
  { name: "Capitã Ysra", role: "comandante de um navio preso no céu", motive: "recuperar a bússola que aponta para a passagem oculta" },
  { name: "Nérian", role: "viajante que sobreviveu ao Reino do Avesso", motive: "provar que a Fenda não é a única saída para salvar o mundo" },
  { name: "Comandante Rovan", role: "líder das forças reunidas contra a Fenda", motive: "abrir caminho até o portal e manter os aliados vivos" },
  { name: "Aster", role: "consciência estelar aprisionada há eras", motive: "ser ouvida antes que os selos decidam seu destino" },
  { name: "Maelis", role: "cartógrafa que atravessou o reino para alcançar você", motive: "devolver aos desaparecidos a possibilidade de escolher o próprio futuro" }
];

const CHAPTER_ONE_CAST = [
  { name: "Maelis", role: "cartógrafa da vila", voice: "fala baixo, como se temesse que a névoa aprendesse suas palavras" },
  { name: "Edda", role: "antiga zeladora do poço", voice: "escolhe cada palavra com a cautela de quem guarda um segredo há anos" },
  { name: "Sira", role: "aprendiz da boticária desaparecida", voice: "tenta parecer corajosa, mas não consegue esconder o medo" },
  { name: "Bram", role: "coveiro e guardião das chaves da capela", voice: "fala com uma calma pesada, acostumada a despedidas" },
  { name: "Tomas", role: "irmão de Maelis, ouvido apenas nas gravações e ecos do sino", voice: "sua voz chega distorcida, como se viesse do fundo de um poço" }
];

function chapterLocation(chapter) {
  return CHAPTER_LOCATIONS[Math.max(0, Math.min(CHAPTER_LOCATIONS.length - 1, Number(chapter) - 1))];
}

function chapterRegion(chapter) {
  return ["em Valedouro", "no Passo dos Corvos", "no Bosque de Miravéu", "na Ponte de Salmour", "em Miralume", "nas Minas de Vidro", "na Abadia de Santa Véspera", "no Pântano de Namar", "na Torre de Horolog", "na Praça da Lua Rubra", "nas Dunas de Cinza", "no Observatório de Arquen", "na Floresta Petrificada de Elarion", "na cidade soterrada de Asterion", "na Forja de Vhal", "no Mar Suspenso de Nimbária", "no Reino do Avesso", "no Bastião da Fenda", "no Coração da Estrela", "nas fronteiras de Valedouro"][Math.max(0, Math.min(CHAPTER_LOCATIONS.length - 1, Number(chapter) - 1))];
}

function sceneCharacter(chapter, subject, isQuest = false) {
  const key = String(subject || "mistério");
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), Number(chapter) || 1);
  if (Number(chapter) === 1) {
    const index = isQuest ? (key.includes("Diário") ? 2 : 1) : (key.includes("Guardião") ? 3 : 3);
    return CHAPTER_ONE_CAST[index];
  }
  return CHAPTER_CHARACTERS[Math.max(0, Math.min(CHAPTER_CHARACTERS.length - 1, Number(chapter) - 1 + (hash % 3 === 0 ? 1 : 0)))];
}

function sceneNarration(chapter, subject, description, isQuest = false) {
  const region = chapterRegion(chapter);
  const character = sceneCharacter(chapter, subject, isQuest);
  const detail = String(description || "").trim();
  const seed = [...String(subject || "mistério")].reduce((sum, char) => sum + char.charCodeAt(0), Number(chapter) || 1);
  const atmosphere = ["A névoa rasteja entre as pedras e esconde marcas recentes.", "Uma corrente de ar frio faz as lanternas oscilarem.", "O cheiro de terra molhada e cinzas denuncia que algo foi perturbado.", "Pequenas gotas escorrem pela pedra, embora não chova há dias."][seed % 4];
  if (isQuest) {
    const openings = [
      "Ao lado de uma caixa de madeira partida " + region + ", você encontra " + character.name + ", " + character.role + ". Ela separa os objetos que conseguiu salvar e ergue os olhos quando você se aproxima.",
      region.charAt(0).toUpperCase() + region.slice(1) + ", uma voz pede ajuda de dentro de um abrigo quase soterrado. É " + character.name + ", " + character.role + ", protegendo uma pista da umidade.",
      "Perto de um marco coberto de fuligem " + region + ", " + character.name + ", " + character.role + ", espera com um mapa amassado nas mãos.",
      "Uma porta entreaberta bloqueia a passagem " + region + ". " + character.name + ", " + character.role + ", aparece do outro lado e explica por que não entrou sozinho."
    ];
    const reveals = ["A pista mostra um símbolo repetido nas casas abandonadas. Alguém tentou raspá-lo da madeira, mas os sulcos continuam visíveis.", "Entre os objetos, há uma página chamuscada com vários nomes riscados. Um deles foi escrito tantas vezes que quase rasgou o papel.", "O objeto guarda um resíduo de energia que pulsa no mesmo ritmo do sino subterrâneo, como se os dois fizessem parte do mesmo mecanismo.", "No verso da pista, alguém desenhou uma rota ausente do mapa de Maelis. Apesar da umidade, a tinta parece recente."];
    const motives = [character.name + " acredita que a pista pode revelar quem esteve ali antes dos desaparecimentos e pede sua ajuda para examiná-la.", character.name + " teme que a névoa apague os últimos vestígios dos moradores desaparecidos.", character.name + " quer confirmar se a pista está ligada ao sino enterrado antes que alguém a destrua.", character.name + " admite que guardou o achado por medo de confiar na pessoa errada."];
    const choices = ["“Se me ajudar, talvez descubramos quem deixou isto aqui”, diz " + character.name + ".", "“Não posso prometer que será seguro”, admite " + character.name + ". “Mas não quero que outra pessoa desapareça.”", "“Se ouvir o sino tocar três vezes, afaste-se do poço”, alerta " + character.name + ".", "“Eu devia ter contado isso antes”, confessa " + character.name + ". “Só não sabia em quem confiar.”"];
    const task = detail ? "Você examina a tarefa: " + detail.charAt(0).toLowerCase() + detail.slice(1) : "Você examina os vestígios à procura de uma explicação.";
    return [openings[seed % openings.length], task, reveals[(seed + 1) % reveals.length], atmosphere, motives[(seed + 2) % motives.length], choices[(seed + 3) % choices.length]].join("\n");
  }
  const enemyName = String(subject || "a criatura desconhecida").trim();
  const enemyDescription = detail ? detail.charAt(0).toLowerCase() + detail.slice(1).replace(/[.!?]+$/, "") : "uma criatura deformada pela corrupção";
  const openings = [
    "Você chega a uma passagem estreita " + region + ". Entre as ruínas, vê " + enemyName + ", " + enemyDescription + ", bloqueando a estrada.",
    "Um ruído de pedra raspando contra pedra vem da trilha " + region + ". Ao se aproximar, você vê " + enemyName + " — " + enemyDescription + " — saindo das sombras.",
    "As marcas no barro levam a uma construção abandonada " + region + ". No centro do caminho, " + enemyName + ", " + enemyDescription + ", ergue a cabeça ao perceber sua presença.",
    "A fita do sino vibra quando você entra na área interditada " + region + ". Logo adiante, " + enemyName + ", " + enemyDescription + ", bloqueia a saída.",
    "Carroças tombadas e pedras partidas bloqueiam a estrada " + region + ". Atrás delas, " + enemyName + ", " + enemyDescription + ", prepara-se para atacar."
  ];
  const actions = ["A criatura golpeia o chão; a poeira revela marcas antigas, dispostas como os dentes de uma fechadura.", "Cada investida termina diante de uma porta de pedra coberta por raízes. Parece proteger algo atrás dela.", "Preso ao corpo da criatura há um medalhão de morador. Por um instante, ela hesita, como se reconhecesse o objeto.", "Uma sombra escapa da criatura e desliza pela parede até desaparecer numa fenda.", "Um fragmento escuro pulsa no peito do inimigo. A cada pulsação, a névoa ao redor se adensa."];
  const stakes = ["A criatura avança e bloqueia a passagem. Para seguir por essa rota, você terá de enfrentá-la ou recuar.", "O chão começa a ceder sob as raízes. Se o confronto se prolongar, a passagem pode desabar.", "O fragmento no peito da criatura reage à fita do sino. Derrotá-la pode revelar por que os dois parecem ligados.", "A névoa fecha a trilha atrás de você. A criatura continua entre você e a estrada, pronta para atacar.", "A porta de pedra permanece escondida atrás do inimigo; você não consegue examiná-la enquanto ele bloquear o caminho."];
  return [openings[seed % openings.length], actions[(seed + 1) % actions.length], atmosphere, stakes[(seed + 2) % stakes.length]].join("\n");
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
        dialogue: "— Não posso resolver isso sem ajuda — diz " + sceneCharacter(chapterData.number, quests[0].title, true).name + ", mantendo a voz baixa. — Você aceita me ajudar ou vai me deixar com essa pista?",
      },
      ordinaryEnemies[0] && {
        key: ordinaryEnemies[0].id, type: "enemy", enemy: ordinaryEnemies[0],
        intro: sceneNarration(chapterData.number, ordinaryEnemies[0].name, ordinaryEnemies[0].description || chapterData.encounterText),
        dialogue: "A criatura inclina o corpo e observa cada movimento seu. Se quiser continuar, terá de decidir como reagir.",
      },
      quests[1] && {
        key: quests[1].id, type: "quest", quest: quests[1],
        intro: sceneNarration(chapterData.number, quests[1].title, quests[1].description, true),
        dialogue: "— O tempo está acabando — diz " + sceneCharacter(chapterData.number, quests[1].title, true).name + ", olhando para a trilha atrás de você. — Ainda posso contar com sua ajuda?",
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
      const battleText = result.victory
        ? [`O confronto contra ${enemy.name} termina quando a criatura perde o equilíbrio e a corrupção abandona seu corpo em fios de fumaça escura.`, `Por um breve instante, o lugar fica em silêncio; até o vento parece esperar para descobrir o que restou sob aquela ameaça.`, `Você percebe marcas antigas na pedra, antes escondidas pelos passos do inimigo, e entende que ele guardava a passagem por muito mais tempo do que imaginava.`, `${enemy.name} já não bloqueia a trilha, e os sobreviventes que aguardavam à distância finalmente podem se aproximar.`, result.message, "Com o caminho livre, você recolhe o que pode ser útil e se prepara para descobrir o que existe além das ruínas."].join("\n")
        : [`O golpe final de ${enemy.name} rompe sua defesa e obriga você a recuar, enquanto o mundo parece perder o som por alguns segundos.`, `Você alcança abrigo atrás de pedras antigas e tenta recuperar o fôlego, sem tirar os olhos da passagem bloqueada.`, `A criatura não persegue você; limita-se a guardar o caminho, como se obedecesse a uma ordem gravada muito antes de sua chegada.`, `A derrota dói, mas também revela o ritmo dos movimentos do adversário e os pontos frágeis que você não conseguiu aproveitar desta vez.`, result.message, "Você ainda poderá tentar novamente quando estiver preparado, mas a jornada não avançará enquanto essa ameaça permanecer de pé."].join("\n");
      const lines = [{ id: `battle-${enemy.id}-${result.victory ? "victory" : "defeat"}`, type: "outcome", text: battleText }];
      if (result.victory && enemy.kind === "boss") {
        const chapterNumber = Number(activeSave.chapterCurrent);
        const chapterEnding = chapterNumber === 1
          ? [
              "Quando o Guardião do Sino cai, a névoa deixa de avançar e começa a recuar pelas ruas de Valedouro, como uma maré puxada para dentro da terra.",
              "Bram corre até o marco da praça e ajuda você a remover as pedras que cobriam o mecanismo antigo; sob elas, o sino está rachado, mas ainda inteiro.",
              "Maelis encontra entre os escombros a fita que pertencia a Tomas e ouve, pela primeira vez desde o desaparecimento, a voz do irmão sem a distorção da corrupção.",
              "O eco revela que Tomas não provocou o desaparecimento: ele tentou selar algo que despertou sob a vila e foi arrastado para além da estrada.",
              "Ao amanhecer, algumas portas se abrem e os sobreviventes voltam à praça. Valedouro não está salva por completo, mas agora seus moradores sabem que a névoa pode ser enfrentada.",
              "Maelis marca no mapa a direção indicada pelo último eco do sino. A estrada dos corvos é o próximo passo, e ela entrega a você uma cópia do mapa antes de ficar para ajudar a reconstruir a vila."
            ].join("\n")
          : [
              "Com a queda do guardião, a ameaça que dominava " + chapterLocation(chapterNumber) + " perde sua força, e os sinais de corrupção começam a desaparecer das pedras.",
              "Os moradores e viajantes que aguardavam escondidos deixam seus abrigos, ainda cautelosos, mas já sem ouvir os sussurros que os mantinham presos.",
              "Entre os destroços, você encontra provas de que o inimigo protegia uma passagem ligada à mesma força que ameaça Valedouro.",
              "Seu aliado reúne os sobreviventes e promete manter a rota aberta enquanto você segue adiante; ninguém confunde essa vitória com o fim da jornada.",
              "Antes de partir, você registra no mapa o que aprendeu e guarda um símbolo retirado do local, uma nova pista sobre a origem da corrupção.",
              "A estrada para o próximo destino se abre diante de você. O lugar ficou para trás, mas as consequências desta batalha continuarão acompanhando sua jornada."
            ].join("\n");
        lines.push({ id: `chapter-ending-${chapterNumber}`, type: "narration", text: chapterEnding });
      }
      if (result.victory && result.rewards) {
        lines.push({ id: `battle-reward-${enemy.id}`, type: "outcome", text: `Recompensas: +${result.rewards.xp} XP e +${result.rewards.gold} moedas${result.rewards.levelsGained ? `; níveis ganhos: ${result.rewards.levelsGained}` : ""}.` });
      }
      const drops = (result.drops ?? []).filter((drop) => drop.granted).map((drop) => drop.name);
      if (drops.length) lines.push({ id: `battle-drops-${enemy.id}`, type: "outcome", text: `Você encontrou: ${drops.join(", ")}.` });
      setStoryEntries((entries) => {
        const newEntries = lines.filter((line) => !entries.some((entry) => entry.id === line.id));
        return [...entries, ...newEntries];
      });
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
        setStoryEntries((entries) => [...entries, { id: "chapter-" + activeSave.chapterCurrent + "-path-" + Date.now(), type: "narration", text: [`Você deixa para trás o último abrigo e segue até ${chapterLocation(chapterData.number)}.`, chapterData?.encounterText || "A paisagem guarda sinais de uma ameaça antiga.", "Maelis marcou a rota no mapa com tinta azul, mas algumas linhas mudam de lugar sempre que a névoa se adensa.", "Entre as pedras, você encontra pegadas recentes e um pedaço de tecido preso a um galho; alguém passou por ali tentando fugir sem ser visto.", "O vento traz um som distante, quase uma voz chamando debaixo da terra, e a fita do sino vibra contra seu equipamento.", "Você segue em frente, decidido a descobrir quem está chamando os desaparecidos e por que a trilha parece reconhecer seus passos."].join("\n") }]);
      } }]
    : currentEvent?.type === "quest"
      ? [
          { id: currentEvent.key + "-accept", label: "Aceitar missão", disabled: questBusy, onClick: () => resolveQuest(currentEvent.quest, "accept") },
          { id: currentEvent.key + "-decline", label: "Fugir e seguir caminho", disabled: questBusy, onClick: () => resolveQuest(currentEvent.quest, "decline") },
        ]
      : currentEvent?.type === "enemy"
        ? [
            { id: currentEvent.key + "-fight", label: "Enfrentar " + currentEvent.enemy.name, disabled: battleBusy || (activeSave?.hpCurrent ?? 0) <= 0, onClick: () => fightEnemy(currentEvent.enemy) },
            { id: currentEvent.key + "-flee", label: "Recuar por enquanto", disabled: battleBusy, onClick: () => setStoryEntries((entries) => entries.some((entry) => entry.id === "flee-" + currentEvent.key) ? entries : [...entries, { id: "flee-" + currentEvent.key, type: "outcome", text: "Você recua para manter distância de " + currentEvent.enemy.name + ". O caminho continua bloqueado; será preciso voltar e enfrentar o perigo para avançar." }]) },
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
