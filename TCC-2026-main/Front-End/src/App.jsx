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

function BattleModal({ battle, busy, onRoll, onClose, onDropChoice }) {
  const [animationAction, setAnimationAction] = useState(null);
  const [animatedHp, setAnimatedHp] = useState(null);
  useEffect(() => {
    const turns = battle?.combat?.turns || [];
    if (!battle?.result || !turns.length) {
      setAnimationAction(null);
      return undefined;
    }
    let cancelled = false;
    const timers = [];
    setAnimatedHp({ playerHp: battle.combat.playerMaxHp, enemyHp: battle.combat.enemyMaxHp });
    let index = 0;
    const schedule = (callback, delay) => {
      timers.push(setTimeout(() => {
        if (!cancelled) callback();
      }, delay));
    };
    const playTurn = () => {
      if (cancelled || index >= turns.length) {
        setAnimationAction(null);
        return;
      }
      // Cada ataque tem sua animação; depois dela, há 800 ms de pausa.
      setAnimationAction("player");
      schedule(() => {
        setAnimationAction(null);
        setAnimatedHp({ playerHp: turns[index]?.playerHp ?? battle.combat.playerMaxHp, enemyHp: turns[index]?.enemyHp ?? battle.combat.enemyMaxHp });
        if (turns[index]?.enemyRoll) {
          schedule(() => {
            setAnimationAction("enemy");
            schedule(() => {
              setAnimationAction(null);
              setAnimatedHp({ playerHp: turns[index]?.playerHp ?? battle.combat.playerHp, enemyHp: turns[index]?.enemyHp ?? battle.combat.enemyHp });
              index += 1;
              // Pausa após o ataque inimigo antes de voltar ao jogador.
              schedule(playTurn, 800);
            }, 500);
          }, 800);
        } else {
          index += 1;
          // Também deixa o golpe final ser visto antes de encerrar a animação.
          schedule(playTurn, 800);
        }
      }, 500);
    };
    // Dá tempo para o resultado do D20 aparecer antes de começar a luta.
    schedule(playTurn, 800);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  // A escolha de pegar/descartar altera battle.result.drops, mas não deve reiniciar a animação.
  // Dependemos apenas do estado final do combate e da sequência de turnos.
  }, [battle?.result?.victory, battle?.result?.permanentDeath, battle?.combat?.turns]);
  if (!battle) return null;
  const combat = battle.combat || {};
  const result = battle.result;
  const displayedPlayerHp = animatedHp?.playerHp ?? (result ? combat.playerMaxHp : combat.playerHp);
  const displayedEnemyHp = animatedHp?.enemyHp ?? (result ? combat.enemyMaxHp : combat.enemyHp);
  const playerPct = combat.playerMaxHp ? Math.max(0, Math.min(100, (displayedPlayerHp / combat.playerMaxHp) * 100)) : 100;
  const enemyPct = combat.enemyMaxHp ? Math.max(0, Math.min(100, (displayedEnemyHp / combat.enemyMaxHp) * 100)) : 100;
  const roll = battle.lastRoll;
  const multiplier = roll ? (roll / 10).toFixed(1) : null;
  const playerClass = battle.classRole || "Aventureiro";
  const playerVisual = ({ Guerreiro: "🛡️", Arqueira: "🏹", Maga: "🪄", Ladino: "🗡️" })[playerClass] || "🧙";
  const enemyVisual = battle.enemy.kind === "boss" ? "👹" : battle.enemy.kind === "elite" ? "👺" : "🐺";
  const drops = result?.drops || [];

  return (
    <div className="battle-modal__backdrop" role="presentation">
      <section className="battle-modal" role="dialog" aria-modal="true" aria-labelledby="battle-modal-title">
        <header className="battle-modal__header">
          <div><p className="battle-modal__eyebrow">COMBATE · D20</p><h2 id="battle-modal-title">{battle.enemy.name}</h2></div>
          <span className="battle-modal__round">{result ? (result.victory ? "Vitória" : "Derrota") : "Prepare-se"}</span>
        </header>

        <div className="battle-modal__fighters">
          <div className="battle-modal__fighter">
            <div className="battle-modal__fighter-title"><span>Você</span><strong>{Math.ceil(displayedPlayerHp ?? combat.playerMaxHp ?? 0)} / {combat.playerMaxHp ?? 0} PV</strong></div>
            <div className="battle-modal__bar"><span className="battle-modal__bar-fill battle-modal__bar-fill--player" style={{ width: playerPct + "%" }} /></div>
          </div>
          <div className="battle-modal__fighter">
            <div className="battle-modal__fighter-title"><span>{battle.enemy.name}</span><strong>{Math.ceil(displayedEnemyHp ?? combat.enemyMaxHp ?? 0)} / {combat.enemyMaxHp ?? battle.enemy.hp} PV</strong></div>
            <div className="battle-modal__bar"><span className="battle-modal__bar-fill battle-modal__bar-fill--enemy" style={{ width: enemyPct + "%" }} /></div>
          </div>
        </div>

        <div className={`battle-modal__arena ${animationAction ? `${animationAction}-attacking` : ""}`}>
          <article className="battle-modal__character-card battle-modal__character-card--player">
            <div className="battle-modal__avatar" aria-hidden="true">{playerVisual}</div>
            <strong>{battle.characterName || "Aventureiro"}</strong>
            <span>{playerClass}</span>
          </article>
          <div className="battle-modal__arena-center" aria-live="polite">
            {roll == null
              ? <button className={`battle-modal__dice ${busy ? "battle-modal__dice--rolling" : ""}`} onClick={onRoll} disabled={busy || Boolean(result)} aria-label="Rolar dado de vinte lados">
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <polygon points="50,3 77,11 94,32 89,61 70,84 50,96 30,84 11,61 6,32 23,11" />
                    <path d="M50 3 L50 50 L23 11 M77 11 L50 50 L94 32 M94 32 L50 50 L89 61 M89 61 L50 50 L70 84 M70 84 L50 50 L50 96 M50 96 L50 50 L30 84 M30 84 L50 50 L11 61 M11 61 L50 50 L6 32 M6 32 L50 50 L23 11 M23 11 L50 50 L77 11" />
                    <text x="50" y="68" textAnchor="middle">D20</text>
                  </svg>
                </button>
              : <div className="battle-modal__final-roll"><span>D20</span><strong>{roll}</strong><small>×{multiplier}</small></div>}
            <p className="battle-modal__dice-caption">{busy ? "A batalha está acontecendo..." : result ? (result.victory ? "Inimigo derrotado!" : "Combate encerrado") : "Clique uma vez para decidir a batalha"}</p>
            {result && <p className={`battle-modal__roll-result ${result.victory ? "is-success" : "is-failure"}`}>{result.victory ? "Vitória" : "Derrota"}{combat.turns?.some((turn) => turn.playerCritical || turn.enemyCritical) ? " · Crítico no combate!" : ""}</p>}
          </div>
          <article className="battle-modal__character-card battle-modal__character-card--enemy">
            <div className="battle-modal__avatar" aria-hidden="true">{enemyVisual}</div>
            <strong>{battle.enemy.name}</strong>
            <span>{battle.enemy.kind === "boss" ? "Chefe" : battle.enemy.kind === "elite" ? "Elite" : "Inimigo"}</span>
          </article>
        </div>

        {result && <section className="battle-modal__drops">
          <h3>{result.victory ? "Drops do inimigo" : "Resultado do combate"}</h3>
          {!result.victory && <p className="battle-modal__drops-empty">Nenhum drop: você não venceu este confronto.</p>}
          {result.victory && drops.length === 0 && <p className="battle-modal__drops-empty">Este inimigo não deixou itens desta vez.</p>}
          {result.victory && drops.map((drop) => (
            <div className="battle-modal__drop" key={drop.code}>
              <div><strong>{drop.name}</strong><span>{drop.claimed ? "Adicionado ao inventário" : drop.discarded ? "Descartado" : drop.reason === "inventory_full" ? "Inventário cheio — descarte este item para continuar" : "Item encontrado"}</span></div>
              {!drop.claimed && !drop.discarded && <div className="battle-modal__drop-actions">
                <button onClick={() => onDropChoice(drop.code, "claim")} disabled={busy}>Pegar</button>
                <button onClick={() => onDropChoice(drop.code, "discard")} disabled={busy}>Descartar</button>
              </div>}
            </div>
          ))}
        </section>}

        {result && <p className={`battle-modal__outcome ${result.victory ? "is-victory" : "is-defeat"}`}>{result.victory ? "Você venceu! XP e moedas foram contabilizados." : result.permanentDeath ? "Derrota permanente: a campanha foi encerrada." : "Você perdeu o combate e perdeu 1 ponto de Moral."}</p>}
        <footer className="battle-modal__footer">
          {!roll && !result
            ? <span className="battle-modal__footer-hint">Uma única rolagem resolve toda a batalha.</span>
            : <button className="battle-modal__primary" onClick={onClose} disabled={busy || (result?.victory && drops.some((drop) => !drop.claimed && !drop.discarded))}>{result?.victory && drops.some((drop) => !drop.claimed && !drop.discarded) ? "Escolha os drops para continuar" : "Fechar batalha"}</button>}
        </footer>
      </section>
    </div>
  );
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
  const [battle, setBattle] = useState(null);
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
    setInventory(inv.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, description: item.description ?? "", rarity: item.rarity ?? "comum", stats: item.stats ?? {}, price: item.price ?? 0, damage: item.damage ?? 0, armorHp: item.armorHp ?? 0, qty: item.quantity, sellPrice: item.sellPrice ?? 0 })));
    setEquipment(eqp.map((item) => ({ id: item.id, itemId: item.itemId, name: item.name, type: item.type, icon: item.iconUrl, description: item.description ?? "", rarity: item.rarity ?? "comum", stats: item.stats ?? {}, price: item.price ?? 0, damage: item.damage ?? 0, armorHp: item.armorHp ?? 0, slot: item.slot })));
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
    if (!activeSave || battleBusy || battle) return;
    setBattleBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/battle/${encodeURIComponent(enemy.id)}/resolve`, {
        method: "POST", body: JSON.stringify({ rolls: [] }),
      });
      setBattle({ enemy, rolls: [], combat: result.combat, lastRoll: null, result: null, characterName: activeSave.characterName, classRole: activeSave.classRole });
      setNotice("");
    } catch (error) { setNotice(error.message); }
    finally { setBattleBusy(false); }
  };

  const rollBattleDie = async () => {
    if (!activeSave || !battle || battleBusy || battle.result || battle.lastRoll != null) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    setBattleBusy(true);
    try {
      const result = await apiFetch(`/saves/${activeSave.id}/battle/${encodeURIComponent(battle.enemy.id)}/resolve`, {
        method: "POST", body: JSON.stringify({ rolls: [roll] }),
      });
      // Mantém o D20 animado e visível por pelo menos 700 ms antes de revelar o resultado.
      await new Promise((resolve) => setTimeout(resolve, 700));
      setBattle((current) => current ? { ...current, rolls: [roll], lastRoll: roll, combat: result.combat, result } : current);
      if (result.save) updateSaveInLists(result.save);
      const stamp = Date.now();
      const enemy = battle.enemy;
      const battleText = result.victory
        ? `Após uma única rolagem de ${roll}, você derrotou ${enemy.name}.`
        : result.permanentDeath
          ? `A batalha contra ${enemy.name} terminou em derrota definitiva.`
          : `A rolagem ${roll} não foi suficiente para derrotar ${enemy.name}; você perdeu 1 ponto de Moral.`;
      const lines = [{ id: `battle-${enemy.id}-${result.victory ? "victory" : "defeat"}-${stamp}`, type: "narration", text: battleText }];
      if ((result.victory || result.chapterAdvanced) && enemy.kind === "boss" && !result.permanentDeath) {
        const chapterNumber = Number(activeSave.chapterCurrent);
        const chapterEnding = chapterData?.ending || ("A ameaça em " + chapterLocation(chapterNumber) + " foi superada. Os sobreviventes começam a reconstruir o caminho, e as pistas reunidas apontam para a próxima região da campanha.");
        lines.push({ id: `chapter-ending-${chapterNumber}-${stamp}`, type: "narration", text: chapterEnding });
      }
      if (result.victory && result.rewards) {
        lines.push({ id: `battle-reward-${enemy.id}-${stamp}`, type: "outcome", text: `Recompensas: +${result.rewards.xp} XP e +${result.rewards.gold} moedas${result.rewards.levelsGained ? `; níveis ganhos: ${result.rewards.levelsGained}` : ""}.` });
      }
      setStoryEntries((entries) => [...entries, ...lines]);
      await refreshSaves();
      if (result.save) await refreshGameData(result.save);
      setNotice("");
    } catch (error) {
      setBattle((current) => current ? { ...current, lastRoll: null } : current);
      setNotice(error.message);
    } finally { setBattleBusy(false); }
  };

  const chooseBattleDrop = async (itemCode, action) => {
    if (!activeSave || !battle?.enemy || battleBusy || !battle.result?.victory) return;
    setBattleBusy(true);
    try {
      const response = await apiFetch(`/saves/${activeSave.id}/battle/${encodeURIComponent(battle.enemy.id)}/drops/${encodeURIComponent(itemCode)}/${action}`, {
        method: "POST", body: JSON.stringify({}),
      });
      setBattle((current) => current ? {
        ...current,
        result: { ...current.result, drops: (current.result.drops || []).map((drop) => drop.code === itemCode ? { ...drop, claimed: action === "claim" && response.claimed, discarded: action === "discard" } : drop) },
      } : current);
      if (action === "claim") await refreshGameData(activeSave);
      setNotice("");
    } catch (error) { setNotice(error.message); }
    finally { setBattleBusy(false); }
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
      <BattleModal battle={battle} busy={battleBusy} onRoll={rollBattleDie} onDropChoice={chooseBattleDrop} onClose={() => { if (!battleBusy && battle?.result && !(battle.result.victory && (battle.result.drops || []).some((drop) => !drop.claimed && !drop.discarded))) setBattle(null); }} />
      <GameMenu onSave={saveCurrentGame} onExitToMenu={() => { setScreen("menu"); setNotice(""); }} />
    </div>
  );
}
