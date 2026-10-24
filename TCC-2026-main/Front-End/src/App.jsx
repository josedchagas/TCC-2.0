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

const QUEST_AFTERMATH = [
  {"success":"A descoberta confirma que o sino e os desaparecimentos estão ligados a um mecanismo sob a vila. A pista é anotada no mapa de Maelis para orientar a busca pela estrada.","failure":"Você deixa o local sem uma resposta completa. Ainda assim, a fita do sino reage às marcas sob as pedras, oferecendo uma direção para continuar a investigação."},
  {"success":"As placas recuperadas revelam que os corvos seguem uma melodia usada para guiar viajantes até o altar. Tovan pode agora alertar outras caravanas.","failure":"A rota até o altar continua incerta, mas Tovan reconhece parte da melodia e indica uma trilha menos exposta."},
  {"success":"A lembrança preservada nas flores permite distinguir a corrupção das vozes verdadeiras. Iria registra o padrão para que ninguém precise entregar uma memória ao bosque.","failure":"A árvore não revela tudo, mas a pétala salva prova que as vozes são lembranças aprisionadas, não chamados dos mortos."},
  {"success":"O reparo e as inscrições deixam uma rota segura para quem vier atrás. Bram identifica o caminho dos cristais que seguem para Miralume.","failure":"A travessia principal continua perigosa, então Bram marca uma rota alternativa. O avanço será mais lento, mas outros viajantes não cairão no abismo."},
  {"success":"Os registros libertam comerciantes das dívidas mágicas e mostram que a guilda compra cristais das minas. Nara promete espalhar a prova antes que os cobradores voltem.","failure":"A guilda mantém parte do controle, mas a lanterna danificada ainda revela o símbolo dos contratos. Nara começa a reunir comerciantes dispostos a resistir."},
  {"success":"A frequência correta abre a galeria sem destruir os cristais. Dália conduz os mineiros para fora e confirma que o núcleo recebe energia de outro lugar.","failure":"A galeria permanece fechada, mas o mineiro é retirado da camada cristalina e a sequência de pulsos fica registrada para uma nova tentativa."},
  {"success":"O fragmento do juramento confirma que a abadia ajudou a construir a prisão da Fenda. Cael aceita revelar os nomes dos guardiões que esconderam a verdade.","failure":"O arquivo continua incompleto, mas as marcas mostram quem levou o registro. Cael abre a passagem e continua procurando os nomes apagados."},
  {"success":"O nome recuperado rompe o silêncio imposto pelo pântano e revela a rota até a torre afundada. Sena marca o caminho para que outros não sejam atraídos pelas vozes.","failure":"Você não recupera o nome inteiro, mas entende que responder às vozes fortalece os guardiões. Sena conduz você até a torre por uma rota estreita."},
  {"success":"O mecanismo volta a avançar e revela a passagem temporal escondida. Oren consegue libertar os viajantes presos no ciclo e aponta quando o festival abrirá a Fenda.","failure":"O ciclo persiste, mas você memoriza a única saída que não se repete. Oren permanece para tentar estabilizar o relógio."},
  {"success":"A prova expõe o ritual antes que a multidão seja usada. Nara reúne comerciantes e moradores para esvaziar a praça e confrontar a guilda.","failure":"O agente escapa, mas o símbolo deixado por ele confirma que o festival encobre o ritual. Nara usa a pista para alertar os comerciantes."},
  {"success":"A caravana recupera forças e Samir confirma a rota estelar. Os viajantes seguem para abrigo, enquanto você recebe o mapa do observatório.","failure":"A água encontrada basta para manter a caravana viva, embora a rota continue incerta. Samir identifica a direção geral do observatório."},
  {"success":"A lente alinhada revela a fraqueza do selo e confirma a mensagem de Tomas. Liora copia os cálculos para que o conhecimento não desapareça com o observatório.","failure":"A visão permanece incompleta, mas a lente mostra o ponto mais estável da Fenda. Liora registra uma aproximação segura."},
  {"success":"A sentinela reconhece o símbolo da Aurora e ajuda a proteger as lembranças libertadas. Eron confirma que a árvore é uma âncora viva.","failure":"A sentinela não desperta, mas a seiva preservada mantém a árvore estável. Eron protege as memórias enquanto você segue para Asterion."},
  {"success":"A lembrança recuperada identifica quem ordenou o apagamento de Asterion. Aveline registra os nomes nas paredes para que a cidade não seja esquecida outra vez.","failure":"A memória não retorna por completo, mas a frase preservada confirma a existência da segunda âncora. Aveline indica o acesso inferior."},
  {"success":"A peça forjada aceita o juramento sem apagar as memórias do metal. Varek pode usá-la para estabilizar a âncora e preparar a passagem para Nimbária.","failure":"A peça não assume a forma desejada, mas o fragmento resiste ao calor e continua útil. Varek guarda o material para reforçar a aliança."},
  {"success":"A tripulação estabiliza o convés e a rota pelo mar fica marcada. Ysra mantém a passagem aberta para quem precisar retornar.","failure":"O navio permanece estável apenas por algum tempo, mas a tripulação consegue avançar. Ysra marca a corrente menos perigosa."},
  {"success":"O reflexo recupera a própria forma e mostra uma possibilidade além de destruir ou libertar a estrela sem proteção. Nérian confia na rota para a fortaleza.","failure":"A visão se desfaz, mas a advertência revela o preço das escolhas extremas. Nérian guia você para fora do labirinto de reflexos."},
  {"success":"A linha de suprimentos volta a funcionar e os aliados preparam o avanço. Rovan usa o tempo ganho para reunir as forças em torno dos três selos.","failure":"Parte da carga se perde, mas o essencial chega aos defensores. Rovan mantém a aliança unida e ajusta o plano."},
  {"success":"As memórias formam uma rota estável até a ponte de retorno. Aster confirma que os desaparecidos ainda podem ser alcançados se os selos forem usados juntos.","failure":"A memória central sobrevive à interferência e mantém aberta uma passagem estreita. Aster alerta que o tempo está acabando, mas a decisão ainda é possível."},
  {"success":"A mensagem esclarece como os três selos podem transformar a prisão numa passagem controlada. Maelis prepara o sino para sustentar o caminho durante o confronto final.","failure":"A mensagem chega incompleta, mas o mensageiro confirma que os selos precisam permanecer juntos. Maelis ajuda você a compreender o risco da escolha final."}
];

function sceneNarration(chapter, subject, description, isQuest = false, stageText = "", stageIndex = 0) {
  const detail = String(description || "").trim();
  const name = String(subject || "a ameaça desconhecida").trim();
  const context = String(stageText || "").trim();
  if (isQuest) return [context, detail ? "A tarefa que se apresenta é clara: " + detail.charAt(0).toLowerCase() + detail.slice(1) : "Você precisa investigar a pista antes que ela desapareça."].filter(Boolean).join("\n");
  if (stageIndex === 4) return [context || "A última ameaça deste lugar se ergue diante de você.", "À sua frente está " + name + (detail ? ": " + detail.charAt(0).toLowerCase() + detail.slice(1) : "."), "Tudo o que você descobriu neste capítulo conduz a este confronto. Se vencer, poderá alcançar a verdade por trás do que aconteceu aqui."].join("\n");
  return [context, "A ameaça que bloqueia o caminho é " + name + (detail ? ". " + detail.charAt(0).toUpperCase() + detail.slice(1) : "."), "O confronto pode abrir a passagem e revelar o próximo elo da história."].filter(Boolean).join("\n");
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
    if (!activeSave || activeSave.completed || activeSave.hpCurrent <= 0 || activeSave.energyCurrent <= 0 || !chapterData || chapterLoadedForSaveId !== activeSave.id || chapterData.number !== activeSave.chapterCurrent || !storyStarted) return null;
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
        intro: sceneNarration(chapterData.number, quests[0].title, quests[0].description, true, chapterData.stages?.[0], 0),
        stageIndex: 0,
        dialogue: null,
      },
      ordinaryEnemies[0] && {
        key: ordinaryEnemies[0].id, type: "enemy", enemy: ordinaryEnemies[0],
        intro: sceneNarration(chapterData.number, ordinaryEnemies[0].name, ordinaryEnemies[0].description || "", false, chapterData.stages?.[1], 1),
        stageIndex: 1,
        dialogue: null,
      },
      quests[1] && {
        key: quests[1].id, type: "quest", quest: quests[1],
        intro: sceneNarration(chapterData.number, quests[1].title, quests[1].description, true, chapterData.stages?.[2], 2),
        stageIndex: 2,
        dialogue: null,
      },
      ordinaryEnemies[1] && {
        key: ordinaryEnemies[1].id, type: "enemy", enemy: ordinaryEnemies[1],
        intro: sceneNarration(chapterData.number, ordinaryEnemies[1].name, ordinaryEnemies[1].description || "", false, chapterData.stages?.[3], 3),
        stageIndex: 3,
        dialogue: null,
      },
      boss && {
        key: boss.id, type: "enemy", enemy: boss,
        intro: sceneNarration(chapterData.number, boss.name, boss.description || "", false, chapterData.stages?.[4] || chapterData.encounterText, 4),
        stageIndex: 4,
        dialogue: null,
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
    setInventory(inv.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, description: item.description ?? "", rarity: item.rarity ?? "comum", stats: item.stats ?? {}, price: item.price ?? 0, qty: item.quantity, sellPrice: item.sellPrice ?? 0 })));
    setEquipment(eqp.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, description: item.description ?? "", rarity: item.rarity ?? "comum", stats: item.stats ?? {}, price: item.price ?? 0, slot: item.slot })));
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
    const permanentlyLost = save.hpCurrent <= 0 || save.energyCurrent <= 0;
    return {
      ...save,
      chapterLabel: permanentlyLost ? "DERROTA PERMANENTE" : save.completed ? "Campanha concluída" : `Capítulo ${save.chapterCurrent}`,
      lastPlayed: relativeTime(save.lastPlayedAt),
    };
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
        ? [`O confronto contra ${enemy.name} termina quando a criatura perde o equilíbrio e a corrupção abandona seu corpo em fios de fumaça escura.`, `Por um breve instante, o lugar fica em silêncio; até o vento parece esperar para descobrir o que restou sob aquela ameaça.`, `Você percebe marcas antigas na pedra, antes escondidas pelos passos do inimigo, e entende que ele guardava a passagem por muito mais tempo do que imaginava.`, `${enemy.name} já não bloqueia a trilha, e os sobreviventes que aguardavam à distância finalmente podem se aproximar.`, "Com o caminho livre, você recolhe o que pode ser útil e se prepara para descobrir o que existe além das ruínas."].join("\n")
        : result.permanentDeath
          ? [`O último golpe de ${enemy.name} o derruba. O som ao redor se afasta, a escuridão toma conta da paisagem, e sua jornada termina ali.`].join("\n")
          : result.chapterAdvanced
            ? [`O Guardião do Sino continua de pé quando você recua. O estrondo do confronto faz ceder uma parede lateral, revelando uma passagem estreita.`, "Sem tempo para retomar a luta, você atravessa a abertura enquanto o eco do sino se perde atrás de você. A criatura continua à sua caça, mas a estrada adiante está aberta."].join("\n")
            : [`O golpe de ${enemy.name} o obriga a ceder terreno. Você recua entre as pedras, sentindo o peso da batalha, até encontrar uma abertura estreita que leva adiante.`, "Quando olha para trás, a criatura ainda guarda o caminho. Você segue em frente, levando consigo o eco do confronto."].join("\n");
      const lines = [{ id: `battle-${enemy.id}-${result.victory ? "victory" : "defeat"}`, type: "narration", text: battleText }];
      if ((result.victory || result.chapterAdvanced) && enemy.kind === "boss" && !result.permanentDeath) {
        const chapterNumber = Number(activeSave.chapterCurrent);
        const chapterEnding = chapterData?.ending || ("A ameaça em " + chapterLocation(chapterNumber) + " foi derrotada. Os sobreviventes começam a reconstruir o caminho, e as pistas reunidas apontam para a próxima região da campanha.");
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

  const sellItem = async (item, quantity = 1) => {
    if (!activeSave || !item?.id || shopBusy) return;
    setShopBusy(true);
    try {
      const result = await apiFetch("/saves/" + activeSave.id + "/inventory/" + item.id + "/sell", {
        method: "POST",
        body: JSON.stringify({ quantity }),
      });
      updateSaveInLists(result.save);
      await refreshGameData(result.save);
      setNotice(result.message);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setShopBusy(false);
    }
  };

  const dropItem = async (item) => {
    if (!activeSave || !item?.id) return;
    const confirmed = window.confirm("Largar " + item.name + (item.qty > 1 ? " (todas as " + item.qty + " unidades)" : "") + "? O item será removido do inventário sem receber moedas.");
    if (!confirmed) return;
    try {
      await apiFetch("/saves/" + activeSave.id + "/inventory/" + item.id, { method: "DELETE" });
      await refreshGameData(activeSave);
      setNotice("Você largou " + item.name + ".");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const equipItem = async (item) => {
    if (!activeSave || !item?.itemId) return;

    // Itens novos já informam o slot exato. Para armaduras antigas (type="armor"),
    // inferimos o slot pelo nome para manter compatibilidade com saves existentes.
    let slot = item.type === "weapon" ? "weapon"
      : item.type === "accessory" ? "ring"
      : ["helmet", "chest", "pants", "shield", "boots"].includes(item.type) ? item.type
      : null;

    if (!slot && item.type === "armor") {
      const name = String(item.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (/\b(elmo|capacete|helmet)\b/.test(name)) slot = "helmet";
      else if (/\b(bota|botas|boot|boots)\b/.test(name)) slot = "boots";
      else if (/\b(calca|calcas|pants)\b/.test(name)) slot = "pants";
      else if (/\b(escudo|shield)\b/.test(name)) slot = "shield";
      else if (/\b(peitoral|cota|tunica|manto|armadura|chest|torso)\b/.test(name)) slot = "chest";
    }

    if (!slot) {
      setNotice(`Não foi possível identificar o espaço de equipamento de ${item.name}. Atualize o jogo e tente novamente.`);
      return;
    }

    try {
      const current = equipment.filter((entry) => entry.slot === slot);
      // Os dois espaços de anel são independentes; os demais slots aceitam uma peça cada.
      const target = slot === "ring" && current.length < 2 ? null : current[0];
      if (target) {
        await apiFetch(`/saves/${activeSave.id}/equipment/${target.id}`, {
          method: "PUT",
          body: JSON.stringify({ itemId: item.itemId }),
        });
      } else {
        await apiFetch(`/saves/${activeSave.id}/equipment`, {
          method: "POST",
          body: JSON.stringify({ itemId: item.itemId, slot }),
        });
      }
      await refreshGameData(activeSave);
      setNotice(target
        ? `${item.name} equipado; equipamento anterior devolvido ao inventário.`
        : `${item.name} equipado no espaço de ${slot}.`);
    } catch (error) {
      setNotice(`Não foi possível equipar ${item.name}: ${error.message}`);
    }
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
      const questName = quest.title || "a missão";
      let conclusion;
      if (result.status === "declined" || action === "decline") {
        conclusion = "Você decide não aceitar “" + questName + "”. " + (result.message || "A pessoa que pediu ajuda recolhe a pista e segue sem sua participação.") + " A investigação fica sem solução por enquanto, e você retoma a jornada sem receber recompensas por essa missão.";
      } else if (result.status === "success") {
        const aftermath = QUEST_AFTERMATH[(Number(quest.chapter) || Number(activeSave.chapterCurrent) || 1) - 1]?.success || "A descoberta passa a fazer parte do mapa da campanha.";
        conclusion = "MISSÃO CONCLUÍDA — " + questName + ". " + (result.message || quest.successText || "Você conclui a tarefa e consegue a pista que procurava.") + " " + aftermath;
      } else {
        const aftermath = QUEST_AFTERMATH[(Number(quest.chapter) || Number(activeSave.chapterCurrent) || 1) - 1]?.failure || "A tentativa não resolve tudo, mas você segue com o que conseguiu aprender.";
        conclusion = "MISSÃO NÃO CONCLUÍDA — " + questName + ". " + (result.message || quest.failureText || "A tentativa não sai como esperado.") + " " + aftermath;
      }
      setStoryEntries((entries) => [...entries, { id: "quest-result-" + quest.id + "-" + stamp, type: "outcome", text: conclusion }]);
      if (result.reward) {
        const itemText = result.reward.itemGranted ? "; item recebido: " + result.reward.item : result.reward.item ? "; item previsto, mas não adicionado ao inventário" : "";
        const details = "Recompensas: +" + result.reward.xp + " XP e +" + result.reward.gold + " moedas" + itemText + ".";
        setStoryEntries((entries) => [...entries, { id: "quest-reward-" + quest.id + "-" + stamp, type: "outcome", text: details }]);
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
  const permanentlyLost = Boolean(activeSave && (activeSave.hpCurrent <= 0 || activeSave.energyCurrent <= 0));
  const storyText = permanentlyLost
    ? [
        ...storyEntries,
        { id: "permadeath", type: "outcome", text: "DERROTA PERMANENTE — este save foi perdido porque a vida ou o vigor chegou a zero. Não é possível continuar esta campanha nem recuperar o personagem com itens." },
      ]
    : activeSave?.completed
      ? [
          { id: "ending", type: "narration", text: "A Fenda foi encerrada e a aurora voltou a Valedouro. O futuro do reino agora depende das escolhas que você fez durante a jornada." },
          { id: "ending-note", type: "outcome", text: "Campanha concluída. Você ainda pode revisar seu personagem e os itens encontrados." },
        ]
      : storyEntries;

  const actions = activeSave?.completed || permanentlyLost ? [] : !storyStarted
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
          hp={{ current: Math.min(5, activeSave?.hpCurrent ?? 0), max: 5 }}
          energy={{ current: Math.min(5, activeSave?.energyCurrent ?? 0), max: 5 }}
          money={activeSave?.money ?? 0}
          inventory={inventory}
          equipment={equipment}
          statusOpen={statusOpen}
          onToggleStatus={() => setStatusOpen((value) => !value)}
          onUseItem={useItem}
          onDropItem={dropItem}
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
      <ShopModal shop={shop} open={shopOpen} onClose={() => setShopOpen(false)} onBuy={buyItem} onSell={sellItem} inventory={inventory} money={activeSave?.money ?? 0} busy={shopBusy} />
      <GameMenu onSave={saveCurrentGame} onExitToMenu={() => { setScreen("menu"); setNotice(""); }} />
    </div>
  );
}
