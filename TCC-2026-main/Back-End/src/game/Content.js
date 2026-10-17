
export const ITEMS = [
  { code: "pocao_vida", name: "Poção de Vida", type: "consumable", rarity: "comum", price: 25, description: "Recupera 35 pontos de vida.", effect: { hp: 35 } },
  { code: "pocao_grande", name: "Poção de Vida Maior", type: "consumable", rarity: "incomum", price: 65, description: "Recupera 80 pontos de vida.", effect: { hp: 80 } },
  { code: "tonico_energia", name: "Tônico de Energia", type: "consumable", rarity: "comum", price: 30, description: "Recupera 25 pontos de energia.", effect: { energy: 25 } },
  { code: "elixir_total", name: "Elixir do Viajante", type: "consumable", rarity: "raro", price: 140, description: "Recupera 70 de vida e 40 de energia.", effect: { hp: 70, energy: 40 } },
  { code: "espada_aventureiro", name: "Espada do Aventureiro", type: "weapon", rarity: "comum", price: 90, description: "Uma espada confiável para as primeiras jornadas.", stats: { forca: 3 } },
  { code: "arco_freixo", name: "Arco de Freixo", type: "weapon", rarity: "comum", price: 90, description: "Arco leve, simples e preciso.", stats: { destreza: 3 } },
  { code: "cajado_cobre", name: "Cajado de Cobre", type: "weapon", rarity: "comum", price: 95, description: "Canaliza energia arcana básica.", stats: { inteligencia: 3 } },
  { code: "adaga_lua", name: "Adaga do Luar", type: "weapon", rarity: "incomum", price: 180, description: "Uma lâmina veloz usada por batedores.", stats: { destreza: 4, agilidade: 2 } },
  { code: "lamina_rubi", name: "Lâmina Rubra", type: "weapon", rarity: "raro", price: 360, description: "Aço rubro que vibra com energia antiga.", stats: { forca: 6, destreza: 2 } },
  { code: "espada_aurora", name: "Espada da Aurora", type: "weapon", rarity: "epico", price: 720, description: "Uma arma lendária forjada para enfrentar a noite eterna.", stats: { forca: 9, resistencia: 3 } },
  { code: "tunica_couro", name: "Túnica Reforçada", type: "armor", rarity: "comum", price: 75, description: "Couro reforçado que amortece golpes.", stats: { resistencia: 2 } },
  { code: "cota_batedor", name: "Cota do Batedor", type: "armor", rarity: "incomum", price: 165, description: "Proteção flexível para quem vive na estrada.", stats: { resistencia: 3, agilidade: 1 } },
  { code: "armadura_guardiao", name: "Armadura do Guardião", type: "armor", rarity: "raro", price: 340, description: "Armadura pesada marcada por antigas batalhas.", stats: { resistencia: 6, forca: 2 } },
  { code: "manto_arcanista", name: "Manto do Arcanista", type: "armor", rarity: "incomum", price: 170, description: "Fios encantados protegem e conduzem magia.", stats: { inteligencia: 3, resistencia: 1 } },
  { code: "anel_vigor", name: "Anel do Vigor", type: "accessory", rarity: "incomum", price: 190, description: "Um anel simples que fortalece o corpo.", stats: { resistencia: 2 } },
  { code: "anel_sabio", name: "Anel do Sábio", type: "accessory", rarity: "raro", price: 330, description: "Amplifica a concentração e o raciocínio.", stats: { inteligencia: 4 } },
  { code: "botas_cacador", name: "Botas do Caçador", type: "armor", rarity: "incomum", price: 150, description: "Botas silenciosas para trilhas difíceis.", stats: { agilidade: 3 } },
  { code: "escudo_carvalho", name: "Escudo de Carvalho", type: "armor", rarity: "comum", price: 80, description: "Escudo robusto, feito de madeira antiga.", stats: { resistencia: 3 } },
  { code: "cristal_arcano", name: "Cristal Arcano", type: "material", rarity: "incomum", price: 45, description: "Fragmento de energia usado em rituais e trocas." },
  { code: "presa_sombria", name: "Presa Sombria", type: "material", rarity: "comum", price: 18, description: "Presa de uma criatura corrompida." },
  { code: "escama_draconica", name: "Escama Dracônica", type: "material", rarity: "raro", price: 95, description: "Escama resistente, valorizada por ferreiros." },
  { code: "flor_lua", name: "Flor-da-Lua", type: "material", rarity: "comum", price: 12, description: "Planta luminosa usada em poções." },
  { code: "chave_ruinas", name: "Chave das Ruínas", type: "quest", rarity: "raro", price: 0, description: "Uma chave antiga ligada aos segredos da campanha." },
  { code: "selo_primordial", name: "Selo Primordial", type: "quest", rarity: "lendario", price: 0, description: "Um fragmento essencial para selar a Fenda." },
];

const enemy = (id, name, kind, hp, attack, xp, gold, drops, description = "") => ({
  id, name, kind, hp, attack, xp, gold, drops, description
});

const chaptersRaw = [
  ["A Vila Esquecida", "A névoa cobre as casas vazias de Valedouro. Você encontra marcas negras nas portas e ouve um sino tocar sob a terra. Uma sobrevivente chamada Maelis pede que descubra por que os moradores desapareceram.", "Lobos rondam os poços e uma criatura maior guarda a antiga praça.", "Encontre a origem da névoa e recupere o sino da vila.", [
    enemy("c01_lobo", "Lobo das Sombras", "normal", 42, 8, 22, 14, [{item:"presa_sombria",chance:0.55},{item:"pocao_vida",chance:0.12}], "Predador corrompido pela névoa."),
    enemy("c01_vulto", "Vulto de Palha", "elite", 58, 10, 32, 21, [{item:"flor_lua",chance:0.35},{item:"cristal_arcano",chance:0.12}], "Um espantalho que se move sem vento."),
    enemy("c01_guardiao", "Guardião do Sino", "boss", 105, 13, 75, 55, [{item:"chave_ruinas",chance:1},{item:"tunica_couro",chance:0.2}], "Um antigo protetor dominado pela corrupção.")
  ]],
  ["A Estrada dos Corvos", "Com o sino recuperado, uma trilha se revela na mata. Corvos acompanham seus passos e repetem nomes de pessoas que ainda não nasceram.", "Batedores saqueiam viajantes para alimentar um altar escondido.", "Cruze a estrada e descubra quem está guiando os corvos.", [
    enemy("c02_corvo", "Corvo Ferrugem", "normal", 55, 11, 28, 18, [{item:"flor_lua",chance:0.4}]),
    enemy("c02_saqueador", "Saqueador da Estrada", "elite", 78, 13, 42, 28, [{item:"pocao_vida",chance:0.18},{item:"presa_sombria",chance:0.35}]),
    enemy("c02_capitao", "Capitão dos Corvos", "boss", 135, 17, 95, 70, [{item:"adaga_lua",chance:0.2},{item:"cristal_arcano",chance:0.6}])
  ]],
  ["O Bosque que Sussurra", "As árvores inclinam os troncos como se escutassem. Uma voz chama você pelo nome e promete revelar o destino de Valedouro em troca de uma lembrança.", "Espíritos vegetais e caçadores enlouquecidos defendem o coração do bosque.", "Encontre a raiz da corrupção sem entregar suas memórias.", [
    enemy("c03_esporo", "Esporo Errante", "normal", 70, 13, 36, 22, [{item:"flor_lua",chance:0.65}]),
    enemy("c03_cacador", "Caçador Enfeitiçado", "elite", 95, 16, 52, 34, [{item:"arco_freixo",chance:0.12},{item:"presa_sombria",chance:0.4}]),
    enemy("c03_raiz", "Raiz-Mãe Corrompida", "boss", 170, 20, 120, 90, [{item:"cristal_arcano",chance:0.75},{item:"anel_vigor",chance:0.18}])
  ]],
  ["A Ponte Partida", "Uma ponte de pedra atravessa um abismo sem fundo. Do outro lado, tochas azuis marcam o caminho até uma fortaleza que não aparece em nenhum mapa.", "Mercenários e sentinelas impedem a travessia.", "Abra caminho até a fortaleza e impeça que reforços cheguem à névoa.", [
    enemy("c04_mercenario", "Mercenário Cinzento", "normal", 88, 17, 43, 30, [{item:"tunica_couro",chance:0.12}]),
    enemy("c04_sentinnela", "Sentinela de Pedra", "elite", 120, 19, 62, 42, [{item:"escudo_carvalho",chance:0.18}]),
    enemy("c04_carrasco", "Carrasco da Ponte", "boss", 205, 24, 145, 105, [{item:"espada_aventureiro",chance:0.18},{item:"cristal_arcano",chance:0.65}])
  ]],
  ["O Mercado das Lanternas", "Na vila mercante de Miralume, lanternas flutuantes iluminam um mercado que só surge quando a lua fica vermelha. A mercadora Nara oferece suprimentos, mas alerta que a moeda local atrai cobradores perigosos.", "Agentes de uma guilda tentam tomar o mercado à força.", "Negocie com Nara, reabasteça-se e descubra quem financia a guilda.", [
    enemy("c05_cobrador", "Cobrador da Guilda", "normal", 105, 19, 50, 42, [{item:"pocao_grande",chance:0.18}]),
    enemy("c05_lamina", "Lâmina Contratada", "elite", 140, 22, 72, 55, [{item:"adaga_lua",chance:0.16}]),
    enemy("c05_mestre", "Mestre dos Contratos", "boss", 245, 27, 170, 150, [{item:"anel_sabio",chance:0.15},{item:"cristal_arcano",chance:0.8}])
  ]],
  ["As Minas de Vidro", "Sob Miralume, minas cristalinas brilham como estrelas presas na rocha. Os mineiros desapareceram depois de perfurar uma parede que pulsava como um coração.", "Golems de vidro e larvas cristalinas guardam os túneis.", "Desative o coração mineral antes que a mina desabe.", [
    enemy("c06_larva", "Larva Prismática", "normal", 120, 22, 58, 38, [{item:"cristal_arcano",chance:0.6}]),
    enemy("c06_golem", "Golem Vítreo", "elite", 160, 25, 80, 52, [{item:"escudo_carvalho",chance:0.14}]),
    enemy("c06_coracao", "Coração de Quartzo", "boss", 280, 30, 195, 125, [{item:"lamina_rubi",chance:0.12},{item:"cristal_arcano",chance:1}])
  ]],
  ["A Abadia Sem Voz", "Uma abadia isolada conserva livros cujas páginas foram arrancadas. Os monges se comunicam por gestos e apontam para um vitral que mostra você diante de uma porta negra.", "Acólitos corrompidos protegem o arquivo proibido.", "Recupere o mapa celeste e descubra por que sua imagem aparece no vitral.", [
    enemy("c07_acolito", "Acólito Mudo", "normal", 140, 24, 65, 43, [{item:"cristal_arcano",chance:0.3}]),
    enemy("c07_cavaleiro", "Cavaleiro Penitente", "elite", 185, 28, 92, 62, [{item:"manto_arcanista",chance:0.14}]),
    enemy("c07_abade", "Abade do Silêncio", "boss", 325, 34, 220, 145, [{item:"manto_arcanista",chance:0.25},{item:"chave_ruinas",chance:0.35}])
  ]],
  ["O Pântano dos Nomes", "O mapa leva a um pântano onde cada bolha pronuncia o nome de alguém perdido. Uma barqueira exige que você não responda às vozes, nem mesmo quando ouvir a sua própria.", "Afogados e sanguessugas espectrais surgem sob a água escura.", "Atravesse o pântano e encontre a torre afundada.", [
    enemy("c08_afogado", "Afogado Errante", "normal", 160, 27, 72, 48, [{item:"presa_sombria",chance:0.5}]),
    enemy("c08_sanguessuga", "Sanguessuga Espectral", "elite", 205, 30, 102, 68, [{item:"elixir_total",chance:0.1}]),
    enemy("c08_noiva", "Noiva do Lodo", "boss", 360, 37, 245, 165, [{item:"anel_vigor",chance:0.22},{item:"cristal_arcano",chance:0.8}])
  ]],
  ["A Torre Afundada", "A torre se ergue do pântano ao som de engrenagens submersas. Em cada andar, o tempo corre de maneira diferente e ecos de uma guerra antiga repetem seus últimos instantes.", "Construtos temporais defendem o mecanismo no topo.", "Destrua o relógio que mantém a corrupção presa no passado.", [
    enemy("c09_relogio", "Carrapato de Relógio", "normal", 180, 30, 82, 55, [{item:"cristal_arcano",chance:0.5}]),
    enemy("c09_construto", "Construto Temporal", "elite", 235, 34, 118, 78, [{item:"botas_cacador",chance:0.13}]),
    enemy("c09_mestre", "Mestre dos Segundos", "boss", 410, 42, 280, 190, [{item:"lamina_rubi",chance:0.18},{item:"selo_primordial",chance:0.25}])
  ]],
  ["O Festival da Lua Rubra", "O festival começa em uma cidade onde ninguém projeta sombra. Nara revela que a celebração é um ritual para abrir a Fenda e que o anfitrião é um antigo conselheiro do reino.", "Máscaras vivas e duelistas protegem o palco ritual.", "Interrompa a cerimônia e recupere o primeiro selo primordial.", [
    enemy("c10_mascara", "Máscara Faminta", "normal", 205, 33, 92, 65, [{item:"flor_lua",chance:0.4}]),
    enemy("c10_duelista", "Duelista Rubro", "elite", 270, 38, 135, 95, [{item:"lamina_rubi",chance:0.12}]),
    enemy("c10_conselheiro", "Conselheiro Sem Sombra", "boss", 470, 47, 330, 260, [{item:"selo_primordial",chance:1},{item:"anel_sabio",chance:0.2}])
  ]],
  ["O Deserto de Cinzas", "Além da cidade, o mundo se abre em dunas cinzentas. Caravanas abandonadas apontam para um observatório enterrado, onde astrônomos tentaram prever a chegada da Fenda.", "Escorpiões de cinza e saqueadores disputam os restos das caravanas.", "Atravesse as dunas e recupere as cartas estelares.", [
    enemy("c11_escorpiao", "Escorpião de Cinza", "normal", 235, 36, 105, 72, [{item:"escama_draconica",chance:0.12}]),
    enemy("c11_saqueador", "Saqueador Solar", "elite", 305, 41, 150, 105, [{item:"pocao_grande",chance:0.2}]),
    enemy("c11_colosso", "Colosso de Areia", "boss", 530, 51, 360, 230, [{item:"armadura_guardiao",chance:0.14},{item:"cristal_arcano",chance:1}])
  ]],
  ["O Observatório Partido", "As cartas revelam que a Fenda não veio do céu: foi construída para aprisionar uma estrela consciente. O observatório ainda guarda a lente capaz de enxergar o outro lado.", "Astrólogos enlouquecidos e sentinelas orbitais defendem a lente.", "Reative o observatório e olhe para além da Fenda.", [
    enemy("c12_astrologo", "Astrólogo Desfeito", "normal", 260, 39, 118, 80, [{item:"cristal_arcano",chance:0.6}]),
    enemy("c12_sentinela", "Sentinela Orbital", "elite", 335, 44, 168, 118, [{item:"manto_arcanista",chance:0.16}]),
    enemy("c12_lente", "Guardião da Lente", "boss", 590, 55, 395, 250, [{item:"anel_sabio",chance:0.22},{item:"selo_primordial",chance:0.35}])
  ]],
  ["A Floresta Petrificada", "Do outro lado das montanhas, uma floresta inteira virou pedra no mesmo instante. No centro, uma árvore ainda viva pulsa com luz azul e guarda os nomes de todos os desaparecidos.", "Bestas fossilizadas despertam quando você se aproxima.", "Libere as memórias presas na árvore azul.", [
    enemy("c13_fossil", "Fera Fossilizada", "normal", 285, 42, 130, 88, [{item:"escama_draconica",chance:0.2}]),
    enemy("c13_guardiao", "Guardião Petrificado", "elite", 365, 47, 185, 130, [{item:"armadura_guardiao",chance:0.12}]),
    enemy("c13_arvore", "Coração de Pedra", "boss", 650, 60, 440, 285, [{item:"espada_aurora",chance:0.08},{item:"cristal_arcano",chance:1}])
  ]],
  ["A Cidade Debaixo da Cidade", "Uma escadaria sob as raízes leva a uma cidade intacta, congelada no dia em que a Fenda foi aberta. Seus habitantes repetem a mesma conversa e não percebem que séculos se passaram.", "Guardas sem tempo patrulham as ruas imóveis.", "Encontre o arquiteto da prisão estelar.", [
    enemy("c14_guarda", "Guarda Imóvel", "normal", 310, 45, 142, 96, [{item:"pocao_grande",chance:0.2}]),
    enemy("c14_escriba", "Escriba do Vazio", "elite", 395, 51, 200, 142, [{item:"cristal_arcano",chance:0.7}]),
    enemy("c14_arquiteto", "Arquiteto da Prisão", "boss", 720, 66, 485, 310, [{item:"selo_primordial",chance:0.6},{item:"lamina_rubi",chance:0.18}])
  ]],
  ["A Forja dos Juramentos", "O arquiteto revela que três selos podem fechar a Fenda, mas cada selo exige um juramento verdadeiro. Na forja ancestral, você deverá escolher o que está disposto a perder para salvar os desaparecidos.", "Forjados de metal vivo testam a força de cada juramento.", "Reacenda a forja e prepare uma arma capaz de ferir a estrela.", [
    enemy("c15_forjado", "Forjado Incandescente", "normal", 340, 49, 155, 108, [{item:"escama_draconica",chance:0.25}]),
    enemy("c15_martelo", "Martelo Juramentado", "elite", 435, 56, 220, 155, [{item:"espada_aurora",chance:0.1}]),
    enemy("c15_mestre", "Mestre da Forja", "boss", 790, 73, 540, 380, [{item:"espada_aurora",chance:0.18},{item:"selo_primordial",chance:1}])
  ]],
  ["O Mar Suspenso", "Uma escada de água sobe até um oceano suspenso no céu. Navios naufragados flutuam entre nuvens e criaturas marinhas guardam a última rota para a Fenda.", "Corsários espectrais e monstros abissais atacam os convés abandonados.", "Recupere a bússola que aponta para aquilo que não deveria existir.", [
    enemy("c16_corsario", "Corsário Espectral", "normal", 370, 52, 170, 120, [{item:"anel_vigor",chance:0.16}]),
    enemy("c16_serpente", "Serpente de Nuvem", "elite", 475, 59, 245, 175, [{item:"escama_draconica",chance:0.5}]),
    enemy("c16_leviata", "Leviatã Suspenso", "boss", 860, 78, 600, 420, [{item:"armadura_guardiao",chance:0.2},{item:"selo_primordial",chance:0.4}])
  ]],
  ["O Reino do Avesso", "A bússola abre uma passagem para um reino espelhado. Lá, cada pessoa encontra uma versão de si que tomou decisões diferentes; a sua cópia afirma que a Fenda é a única forma de impedir uma catástrofe maior.", "Reflexos hostis imitam suas técnicas e exploram suas fraquezas.", "Derrote seu reflexo e descubra a verdade por trás da estrela.", [
    enemy("c17_reflexo", "Reflexo Errante", "normal", 400, 56, 185, 132, [{item:"elixir_total",chance:0.16}]),
    enemy("c17_duplo", "Duplo de Prata", "elite", 510, 64, 260, 190, [{item:"lamina_rubi",chance:0.2}]),
    enemy("c17_sombra", "Seu Outro Eu", "boss", 930, 84, 660, 460, [{item:"espada_aurora",chance:0.2},{item:"selo_primordial",chance:0.5}])
  ]],
  ["O Cerco da Fenda", "As forças reunidas por Maelis, Nara e os sobreviventes cercam a fortaleza final. Os três selos começam a reagir, mas a estrela desperta e transforma o campo de batalha em um labirinto de gravidade quebrada.", "Comandantes da Fenda tentam impedir que os aliados cheguem ao portal.", "Abra caminho até o núcleo e proteja os três selos.", [
    enemy("c18_comandante", "Comandante da Fenda", "normal", 440, 60, 205, 150, [{item:"cristal_arcano",chance:0.8}]),
    enemy("c18_colosso", "Colosso do Portal", "elite", 560, 68, 285, 205, [{item:"armadura_guardiao",chance:0.18}]),
    enemy("c18_arauto", "Arauto da Estrela", "boss", 1020, 90, 720, 520, [{item:"selo_primordial",chance:1},{item:"espada_aurora",chance:0.22}])
  ]],
  ["O Coração da Estrela", "No centro da Fenda, você encontra a estrela consciente: uma memória viva de um mundo destruído. Ela não deseja conquistar o reino; quer escapar de uma prisão que está se desfazendo e ameaça levar tudo junto.", "Fragmentos estelares protegem o coração enquanto você decide como terminar o ritual.", "Sobreviva ao último teste e escolha o destino da estrela.", [
    enemy("c19_fragmento", "Fragmento Estelar", "normal", 480, 65, 225, 165, [{item:"cristal_arcano",chance:1}]),
    enemy("c19_oraculo", "Oráculo Despedaçado", "elite", 610, 73, 310, 225, [{item:"anel_sabio",chance:0.25}]),
    enemy("c19_coracao", "Coração da Estrela", "boss", 1120, 98, 800, 600, [{item:"selo_primordial",chance:1},{item:"elixir_total",chance:0.5}])
  ]],
  ["A Última Aurora", "Com os selos reunidos, o reino inteiro parece prender a respiração. Você pode fechar a Fenda e apagar a estrela, libertá-la assumindo o risco ou encontrar uma terceira solução usando as memórias resgatadas. O sino de Valedouro toca uma última vez.", "A corrupção final toma forma para impedir sua decisão.", "Enfrente a manifestação final e determine o futuro de Valedouro.", [
    enemy("c20_guardiao", "Último Guardião", "normal", 520, 70, 245, 180, [{item:"escama_draconica",chance:0.6}]),
    enemy("c20_devorador", "Devorador de Auroras", "elite", 680, 80, 340, 250, [{item:"espada_aurora",chance:0.16}]),
    enemy("c20_noite", "A Noite Sem Fim", "boss", 1350, 110, 1200, 1000, [{item:"espada_aurora",chance:0.35},{item:"selo_primordial",chance:1}], "A forma final da corrupção, nascida do medo de perder o mundo.")
  ]],
];

export const CHAPTERS = chaptersRaw.map((row, index) => ({
  number: index + 1,
  title: row[0],
  story: row[1],
  encounterText: row[2],
  objective: row[3],
  shopAvailable: [5, 10, 15, 20].includes(index + 1),
  enemies: row[4],
}));

export const SHOPS = {
  5: {
    name: "Mercado das Lanternas",
    greeting: "Nara abre seu baú de mercadorias: 'A estrada cobra caro de quem viaja despreparado.'",
    itemCodes: ["pocao_vida", "pocao_grande", "tonico_energia", "espada_aventureiro", "arco_freixo", "cajado_cobre", "tunica_couro", "escudo_carvalho", "anel_vigor"]
  },
  10: {
    name: "Bazar da Lua Rubra",
    greeting: "Nara voltou com artefatos raros. 'A partir daqui, cada passo pode ser o último.'",
    itemCodes: ["pocao_vida", "pocao_grande", "tonico_energia", "elixir_total", "adaga_lua", "cota_batedor", "manto_arcanista", "botas_cacador", "anel_sabio"]
  },
  15: {
    name: "Forja dos Juramentos",
    greeting: "O ferreiro oferece armas e armaduras feitas com materiais das regiões corrompidas.",
    itemCodes: ["pocao_grande", "elixir_total", "lamina_rubi", "armadura_guardiao", "anel_sabio", "botas_cacador", "escudo_carvalho"]
  },
  20: {
    name: "Último Refúgio",
    greeting: "Antes do confronto final, os aliados dividem seus últimos suprimentos com você.",
    itemCodes: ["pocao_grande", "elixir_total", "espada_aurora", "armadura_guardiao", "anel_sabio", "manto_arcanista"]
  },
};

export function getItemByCode(code) {
  return ITEMS.find((item) => item.code === code);
}

export function getEnemyById(id) {
  for (const chapter of CHAPTERS) {
    const found = chapter.enemies.find((candidate) => candidate.id === id);
    if (found) return { ...found, chapter: chapter.number };
  }
  return null;
}
