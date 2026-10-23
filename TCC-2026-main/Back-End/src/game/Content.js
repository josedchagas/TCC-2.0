
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
  ["A Vila Esquecida", "A névoa desce sobre Valedouro antes mesmo do anoitecer, espessa o bastante para apagar as casas do outro lado da rua.\nNas portas, marcas negras parecem ter sido queimadas de dentro para fora; nenhuma fechadura foi arrombada, mas todas as mesas continuam postas.\nDo fundo do poço central vem o som de um sino, abafado pela terra, como se alguém pedisse socorro de muito longe.\nUma pessoa sobrevivente espera junto à capela, com as mãos trêmulas e os olhos fixos nas janelas vazias: todos desapareceram numa única noite.\nEla entrega a você uma fita arrancada do sino e implora que descubra o que levou os moradores antes que a névoa alcance a estrada.", "Lobos rondam os poços e uma criatura maior guarda a antiga praça.", "Encontre a origem da névoa e recupere o sino da vila.", [
    enemy("c01_lobo", "Lobo das Sombras", "normal", 42, 8, 22, 14, [{item:"presa_sombria",chance:0.55},{item:"pocao_vida",chance:0.12}], "Predador corrompido pela névoa."),
    enemy("c01_vulto", "Vulto de Palha", "elite", 58, 10, 32, 21, [{item:"flor_lua",chance:0.35},{item:"cristal_arcano",chance:0.12}], "Um espantalho que se move sem vento."),
    enemy("c01_guardiao", "Guardião do Sino", "boss", 105, 13, 75, 55, [{item:"chave_ruinas",chance:1},{item:"tunica_couro",chance:0.2}], "Um antigo protetor dominado pela corrupção.")
  ]],
  ["A Estrada dos Corvos", "Além dos últimos muros de Valedouro, uma estrada estreita serpenteia entre árvores tortas e carroças abandonadas.\nCorvos acompanham cada passo pelos galhos, mas não grasnam: repetem sussurros humanos, inclusive palavras que você ainda não disse.\nPerto de uma ponte de madeira, pegadas recentes desaparecem no barro sem deixar marcas de retorno.\nUm viajante escondido sob os restos de uma carroça aponta para pequenas fitas negras amarradas aos troncos, sinal usado por saqueadores.\nSe alguém está guiando aquelas aves, a trilha leva ao altar escondido antes que a próxima caravana desapareça.", "Batedores saqueiam viajantes para alimentar um altar escondido.", "Cruze a estrada e descubra quem está guiando os corvos.", [
    enemy("c02_corvo", "Corvo Ferrugem", "normal", 55, 11, 28, 18, [{item:"flor_lua",chance:0.4}]),
    enemy("c02_saqueador", "Saqueador da Estrada", "elite", 78, 13, 42, 28, [{item:"pocao_vida",chance:0.18},{item:"presa_sombria",chance:0.35}]),
    enemy("c02_capitao", "Capitão dos Corvos", "boss", 135, 17, 95, 70, [{item:"adaga_lua",chance:0.2},{item:"cristal_arcano",chance:0.6}])
  ]],
  ["O Bosque que Sussurra", "As árvores se fecham atrás de você, entrelaçando galhos como dedos que tentam impedir a passagem.\nO ar cheira a folhas molhadas e cinzas, e cada rajada traz uma voz diferente chamando de dentro dos troncos ocos.\nNo chão, flores pálidas se abrem quando sua sombra passa e murcham assim que você olha diretamente para elas.\nUma figura encapuzada surge entre as raízes, mas seu rosto é apenas um reflexo distorcido de quem está olhando.\nNo coração do bosque, algo pulsa sob a terra e espalha a mesma corrupção que cobriu as casas de Valedouro.", "Espíritos vegetais e caçadores enlouquecidos defendem o coração do bosque.", "Encontre a raiz da corrupção sem entregar suas memórias.", [
    enemy("c03_esporo", "Esporo Errante", "normal", 70, 13, 36, 22, [{item:"flor_lua",chance:0.65}]),
    enemy("c03_cacador", "Caçador Enfeitiçado", "elite", 95, 16, 52, 34, [{item:"arco_freixo",chance:0.12},{item:"presa_sombria",chance:0.4}]),
    enemy("c03_raiz", "Raiz-Mãe Corrompida", "boss", 170, 20, 120, 90, [{item:"cristal_arcano",chance:0.75},{item:"anel_vigor",chance:0.18}])
  ]],
  ["A Ponte Partida", "O caminho termina diante de uma ponte antiga, rachada ao meio sobre um abismo que não devolve o som das pedras.\nTochas azuis ardem do outro lado, embora não haja vento nem sinal de quem as acendeu.\nCorrentes grossas balançam sozinhas, e marcas recentes de botas mostram que alguém atravessou apesar do perigo.\nEntre os pilares, mercenários vigiam a passagem e recolhem qualquer objeto que brilhe com energia arcana.\nPara alcançar a fortaleza além do desfiladeiro, você terá de encontrar uma travessia ou abrir caminho à força.", "Mercenários e sentinelas impedem a travessia.", "Abra caminho até a fortaleza e impeça que reforços cheguem à névoa.", [
    enemy("c04_mercenario", "Mercenário Cinzento", "normal", 88, 17, 43, 30, [{item:"tunica_couro",chance:0.12}]),
    enemy("c04_sentinnela", "Sentinela de Pedra", "elite", 120, 19, 62, 42, [{item:"escudo_carvalho",chance:0.18}]),
    enemy("c04_carrasco", "Carrasco da Ponte", "boss", 205, 24, 145, 105, [{item:"espada_aventureiro",chance:0.18},{item:"cristal_arcano",chance:0.65}])
  ]],
  ["O Mercado das Lanternas", "Miralume surge ao cair da noite, escondida atrás de colinas e iluminada por lanternas que flutuam sem cordas.\nAs barracas vendem mapas sem estradas, frascos cheios de luz e lembranças que ninguém admite ter perdido.\nPor trás da música dos comerciantes, cobradores percorrem as vielas recolhendo moedas em nome de uma guilda que não aparece em nenhum registro.\nUma mercadora de olhar atento oferece abrigo por alguns minutos e avisa que a cidade inteira teme quem controla os contratos.\nAntes de seguir para as minas sob as ruas, você precisa decidir em quem confiar e quais suprimentos serão indispensáveis.", "Agentes de uma guilda tentam tomar o mercado à força.", "Negocie com Nara, reabasteça-se e descubra quem financia a guilda.", [
    enemy("c05_cobrador", "Cobrador da Guilda", "normal", 105, 19, 50, 42, [{item:"pocao_grande",chance:0.18}]),
    enemy("c05_lamina", "Lâmina Contratada", "elite", 140, 22, 72, 55, [{item:"adaga_lua",chance:0.16}]),
    enemy("c05_mestre", "Mestre dos Contratos", "boss", 245, 27, 170, 150, [{item:"anel_sabio",chance:0.15},{item:"cristal_arcano",chance:0.8}])
  ]],
  ["As Minas de Vidro", "Sob as ruas de Miralume, túneis de cristal espalham reflexos que não correspondem aos movimentos de quem passa.\nPicaretas permanecem suspensas no ar, como se os mineiros tivessem largado o trabalho no meio de um golpe e nunca voltado.\nUma parede translúcida pulsa em intervalos lentos, iluminando as galerias como um coração enterrado na pedra.\nAo tocar o chão, você sente vibrações que sobem pelos ossos e formam uma sequência quase semelhante a uma voz.\nSe o núcleo continuar crescendo, toda a montanha poderá se partir e liberar aquilo que os trabalhadores despertaram.", "Golems de vidro e larvas cristalinas guardam os túneis.", "Desative o coração mineral antes que a mina desabe.", [
    enemy("c06_larva", "Larva Prismática", "normal", 120, 22, 58, 38, [{item:"cristal_arcano",chance:0.6}]),
    enemy("c06_golem", "Golem Vítreo", "elite", 160, 25, 80, 52, [{item:"escudo_carvalho",chance:0.14}]),
    enemy("c06_coracao", "Coração de Quartzo", "boss", 280, 30, 195, 125, [{item:"lamina_rubi",chance:0.12},{item:"cristal_arcano",chance:1}])
  ]],
  ["A Abadia Sem Voz", "No alto de uma encosta, uma abadia cinzenta resiste à chuva, cercada por sinos rachados que jamais produzem som.\nOs monges se comunicam por gestos e evitam olhar para o vitral da entrada, onde uma silhueta parece mudar de posição quando ninguém observa.\nA biblioteca foi revirada; páginas arrancadas cobrem o chão e os mapas celestes terminam sempre na mesma mancha escura.\nUm guardião ferido entrega a você um fragmento de pergaminho, insistindo que o arquivo proibido não pode cair nas mãos erradas.\nEntre os corredores silenciosos, há pistas sobre uma porta negra e sobre o motivo de sua imagem aparecer no vidro.", "Acólitos corrompidos protegem o arquivo proibido.", "Recupere o mapa celeste e descubra por que sua imagem aparece no vitral.", [
    enemy("c07_acolito", "Acólito Mudo", "normal", 140, 24, 65, 43, [{item:"cristal_arcano",chance:0.3}]),
    enemy("c07_cavaleiro", "Cavaleiro Penitente", "elite", 185, 28, 92, 62, [{item:"manto_arcanista",chance:0.14}]),
    enemy("c07_abade", "Abade do Silêncio", "boss", 325, 34, 220, 145, [{item:"manto_arcanista",chance:0.25},{item:"chave_ruinas",chance:0.35}])
  ]],
  ["O Pântano dos Nomes", "O pântano começa sem aviso: a trilha firme cede sob seus pés e a água escura engole o reflexo das árvores.\nBolhas sobem da lama pronunciando nomes de pessoas que você nunca conheceu, seguidas por vozes que parecem imitar seus pensamentos.\nUma barqueira espera numa plataforma de raízes e avisa para não responder a chamado algum, nem mesmo ao ouvir a própria voz.\nLuzes verdes marcam um caminho entre os juncos, mas se apagam sempre que você tenta contá-las.\nDo outro lado, uma torre afundada emerge da névoa e faz as águas girarem ao redor de suas paredes.", "Afogados e sanguessugas espectrais surgem sob a água escura.", "Atravesse o pântano e encontre a torre afundada.", [
    enemy("c08_afogado", "Afogado Errante", "normal", 160, 27, 72, 48, [{item:"presa_sombria",chance:0.5}]),
    enemy("c08_sanguessuga", "Sanguessuga Espectral", "elite", 205, 30, 102, 68, [{item:"elixir_total",chance:0.1}]),
    enemy("c08_noiva", "Noiva do Lodo", "boss", 360, 37, 245, 165, [{item:"anel_vigor",chance:0.22},{item:"cristal_arcano",chance:0.8}])
  ]],
  ["A Torre Afundada", "A torre ergue-se do pântano com as janelas submersas e engrenagens visíveis atrás de paredes cobertas de limo.\nCada degrau parece levar a uma hora diferente: poeira cai para cima, velas se reacendem e pegadas antigas aparecem diante de você.\nEm salas repetidas, ecos de soldados revivem os últimos segundos de uma batalha que ninguém venceu.\nNo topo, um relógio enorme continua funcionando apesar de não possuir ponteiros, movido por uma luz presa em seu mecanismo.\nDestruí-lo pode libertar a região do ciclo, mas também revelar o que foi mantido no passado por tanto tempo.", "Construtos temporais defendem o mecanismo no topo.", "Destrua o relógio que mantém a corrupção presa no passado.", [
    enemy("c09_relogio", "Carrapato de Relógio", "normal", 180, 30, 82, 55, [{item:"cristal_arcano",chance:0.5}]),
    enemy("c09_construto", "Construto Temporal", "elite", 235, 34, 118, 78, [{item:"botas_cacador",chance:0.13}]),
    enemy("c09_mestre", "Mestre dos Segundos", "boss", 410, 42, 280, 190, [{item:"lamina_rubi",chance:0.18},{item:"selo_primordial",chance:0.25}])
  ]],
  ["O Festival da Lua Rubra", "A cidade inteira veste máscaras durante o festival, mas nenhuma delas mostra um rosto verdadeiro.\nLanternas vermelhas percorrem o céu em silêncio, e as sombras dos moradores apontam para o palco mesmo quando seus corpos seguem outra direção.\nUma mensagem escondida sob os degraus revela que a celebração não é uma festa, mas parte de um ritual preparado há gerações.\nEntre músicos e dançarinos, agentes disfarçados protegem um conselheiro que nunca projeta sombra.\nQuando a lua alcançar o centro do céu, o ritual abrirá uma passagem que talvez não possa ser fechada novamente.", "Máscaras vivas e duelistas protegem o palco ritual.", "Interrompa a cerimônia e recupere o primeiro selo primordial.", [
    enemy("c10_mascara", "Máscara Faminta", "normal", 205, 33, 92, 65, [{item:"flor_lua",chance:0.4}]),
    enemy("c10_duelista", "Duelista Rubro", "elite", 270, 38, 135, 95, [{item:"lamina_rubi",chance:0.12}]),
    enemy("c10_conselheiro", "Conselheiro Sem Sombra", "boss", 470, 47, 330, 260, [{item:"selo_primordial",chance:1},{item:"anel_sabio",chance:0.2}])
  ]],
  ["O Deserto de Cinzas", "Depois das últimas muralhas, o terreno se transforma num mar de cinzas que cobre estradas, telhados e até os esqueletos das árvores.\nCaravanas abandonadas formam uma linha de silêncio pelo deserto, com bússolas girando e cantis cheios de areia fina.\nÀ noite, estrelas aparecem sob seus pés, como se o céu tivesse sido enterrado e continuasse tentando brilhar.\nUm mapa queimado aponta para um observatório soterrado onde estudiosos tentaram prever a chegada da Fenda.\nA tempestade se aproxima, e cada minuto perdido torna mais difícil distinguir o caminho das miragens.", "Escorpiões de cinza e saqueadores disputam os restos das caravanas.", "Atravesse as dunas e recupere as cartas estelares.", [
    enemy("c11_escorpiao", "Escorpião de Cinza", "normal", 235, 36, 105, 72, [{item:"escama_draconica",chance:0.12}]),
    enemy("c11_saqueador", "Saqueador Solar", "elite", 305, 41, 150, 105, [{item:"pocao_grande",chance:0.2}]),
    enemy("c11_colosso", "Colosso de Areia", "boss", 530, 51, 360, 230, [{item:"armadura_guardiao",chance:0.14},{item:"cristal_arcano",chance:1}])
  ]],
  ["O Observatório Partido", "No alto de um planalto, o observatório permanece inclinado, com cúpulas abertas e lentes quebradas apontadas para um céu sem constelações.\nOs registros preservados revelam que a Fenda não caiu do firmamento: foi construída para aprisionar uma estrela consciente.\nAs anotações terminam abruptamente, cobertas por marcas de unhas e cálculos repetidos até rasgar o papel.\nNo salão principal, uma lente intacta projeta uma imagem de um lugar que não existe no mapa e que parece observar de volta.\nReativar o mecanismo pode revelar uma fraqueza no selo, mas também fará algo do outro lado perceber sua presença.", "Astrólogos enlouquecidos e sentinelas orbitais defendem a lente.", "Reative o observatório e olhe para além da Fenda.", [
    enemy("c12_astrologo", "Astrólogo Desfeito", "normal", 260, 39, 118, 80, [{item:"cristal_arcano",chance:0.6}]),
    enemy("c12_sentinela", "Sentinela Orbital", "elite", 335, 44, 168, 118, [{item:"manto_arcanista",chance:0.16}]),
    enemy("c12_lente", "Guardião da Lente", "boss", 590, 55, 395, 250, [{item:"anel_sabio",chance:0.22},{item:"selo_primordial",chance:0.35}])
  ]],
  ["A Floresta Petrificada", "Além das montanhas, uma floresta inteira está transformada em pedra, congelada no instante em que uma tempestade de luz atravessou o vale.\nFolhas minerais tilintam ao vento e troncos partidos revelam anéis que brilham como brasas sob a superfície cinzenta.\nNo centro, uma árvore azul continua viva, pulsando lentamente como se guardasse milhares de vozes em seu interior.\nAo se aproximar, você reconhece fragmentos de lembranças que pertencem aos moradores desaparecidos de Valedouro.\nAs memórias estão presas por uma força que desperta as feras fossilizadas sempre que alguém tenta libertá-las.", "Bestas fossilizadas despertam quando você se aproxima.", "Libere as memórias presas na árvore azul.", [
    enemy("c13_fossil", "Fera Fossilizada", "normal", 285, 42, 130, 88, [{item:"escama_draconica",chance:0.2}]),
    enemy("c13_guardiao", "Guardião Petrificado", "elite", 365, 47, 185, 130, [{item:"armadura_guardiao",chance:0.12}]),
    enemy("c13_arvore", "Coração de Pedra", "boss", 650, 60, 440, 285, [{item:"espada_aurora",chance:0.08},{item:"cristal_arcano",chance:1}])
  ]],
  ["A Cidade Debaixo da Cidade", "Uma escadaria desce por baixo das raízes e termina numa cidade intacta, iluminada por um sol que nunca se move.\nOs habitantes repetem conversas antigas, abrem portas para visitantes que não existem e não percebem a poeira acumulada nos próprios ombros.\nRelógios parados marcam a mesma hora em todas as praças, enquanto guardas sem idade patrulham ruas que não levam a lugar algum.\nNum arquivo subterrâneo, desenhos mostram a construção de uma prisão ao redor de uma estrela viva.\nO arquiteto dessa obra ainda pode estar aqui, preso no mesmo instante em que condenou a cidade inteira ao esquecimento.", "Guardas sem tempo patrulham as ruas imóveis.", "Encontre o arquiteto da prisão estelar.", [
    enemy("c14_guarda", "Guarda Imóvel", "normal", 310, 45, 142, 96, [{item:"pocao_grande",chance:0.2}]),
    enemy("c14_escriba", "Escriba do Vazio", "elite", 395, 51, 200, 142, [{item:"cristal_arcano",chance:0.7}]),
    enemy("c14_arquiteto", "Arquiteto da Prisão", "boss", 720, 66, 485, 310, [{item:"selo_primordial",chance:0.6},{item:"lamina_rubi",chance:0.18}])
  ]],
  ["A Forja dos Juramentos", "A forja ancestral permanece acesa sem combustível, alimentada por juramentos gravados nas paredes de metal negro.\nCada martelo que repousa sobre a bigorna sussurra uma promessa feita por alguém que nunca voltou para cumpri-la.\nUm artesão de mãos cobertas por fuligem explica, sem erguer os olhos, que os selos só respondem a verdades ditas sem proteção.\nNo centro da oficina, uma arma incompleta aguarda materiais retirados das regiões corrompidas.\nPara prepará-la contra a estrela, você terá de reacender a forja e decidir qual promessa merece ser mantida quando tudo estiver em risco.", "Forjados de metal vivo testam a força de cada juramento.", "Reacenda a forja e prepare uma arma capaz de ferir a estrela.", [
    enemy("c15_forjado", "Forjado Incandescente", "normal", 340, 49, 155, 108, [{item:"escama_draconica",chance:0.25}]),
    enemy("c15_martelo", "Martelo Juramentado", "elite", 435, 56, 220, 155, [{item:"espada_aurora",chance:0.1}]),
    enemy("c15_mestre", "Mestre da Forja", "boss", 790, 73, 540, 380, [{item:"espada_aurora",chance:0.18},{item:"selo_primordial",chance:1}])
  ]],
  ["O Mar Suspenso", "Uma escadaria feita de água sobe pelas nuvens e termina num oceano suspenso sobre o mundo.\nNavios naufragados flutuam de lado no céu, presos entre correntes de espuma que não caem e ondas que se movem contra o vento.\nCriaturas abissais circulam sob o casco das embarcações, atraídas por uma bússola que aponta para um lugar impossível.\nEntre os destroços, um diário encharcado descreve uma rota que muda sempre que alguém tenta registrá-la.\nSem a bússola, a passagem até a Fenda continuará escondida dentro da própria tempestade.", "Corsários espectrais e monstros abissais atacam os convés abandonados.", "Recupere a bússola que aponta para aquilo que não deveria existir.", [
    enemy("c16_corsario", "Corsário Espectral", "normal", 370, 52, 170, 120, [{item:"anel_vigor",chance:0.16}]),
    enemy("c16_serpente", "Serpente de Nuvem", "elite", 475, 59, 245, 175, [{item:"escama_draconica",chance:0.5}]),
    enemy("c16_leviata", "Leviatã Suspenso", "boss", 860, 78, 600, 420, [{item:"armadura_guardiao",chance:0.2},{item:"selo_primordial",chance:0.4}])
  ]],
  ["O Reino do Avesso", "A bússola abre uma passagem para um reino espelhado onde o céu se estende sob os pés e as montanhas pairam como ilhas.\nEm cada janela aparece uma vida diferente: escolhas abandonadas, promessas quebradas e caminhos que nunca foram percorridos.\nUma figura com seu mesmo porte surge ao longe e repete seus gestos com um atraso quase imperceptível.\nEla afirma que a Fenda é a única saída para impedir uma catástrofe maior, mas suas palavras mudam quando o reflexo desvia o olhar.\nPara descobrir a verdade, você terá de atravessar o reino sem confundir o que é real com aquilo que gostaria de ter escolhido.", "Reflexos hostis imitam suas técnicas e exploram suas fraquezas.", "Derrote seu reflexo e descubra a verdade por trás da estrela.", [
    enemy("c17_reflexo", "Reflexo Errante", "normal", 400, 56, 185, 132, [{item:"elixir_total",chance:0.16}]),
    enemy("c17_duplo", "Duplo de Prata", "elite", 510, 64, 260, 190, [{item:"lamina_rubi",chance:0.2}]),
    enemy("c17_sombra", "Seu Outro Eu", "boss", 930, 84, 660, 460, [{item:"espada_aurora",chance:0.2},{item:"selo_primordial",chance:0.5}])
  ]],
  ["O Cerco da Fenda", "As forças reunidas pelos sobreviventes cercam a fortaleza final enquanto o chão se dobra sob uma gravidade instável.\nOs três selos vibram em suas mãos, projetando lembranças de lugares que foram apagados antes mesmo de existirem.\nAliados avançam entre ruínas flutuantes, mas cada passo abre fendas menores que tentam puxá-los para longe do campo de batalha.\nDo outro lado do portal, uma luz imensa desperta e transforma o horizonte numa parede de estrelas em movimento.\nVocê precisa alcançar o núcleo antes que a passagem consuma a última rota de retorno.", "Comandantes da Fenda tentam impedir que os aliados cheguem ao portal.", "Abra caminho até o núcleo e proteja os três selos.", [
    enemy("c18_comandante", "Comandante da Fenda", "normal", 440, 60, 205, 150, [{item:"cristal_arcano",chance:0.8}]),
    enemy("c18_colosso", "Colosso do Portal", "elite", 560, 68, 285, 205, [{item:"armadura_guardiao",chance:0.18}]),
    enemy("c18_arauto", "Arauto da Estrela", "boss", 1020, 90, 720, 520, [{item:"selo_primordial",chance:1},{item:"espada_aurora",chance:0.22}])
  ]],
  ["O Coração da Estrela", "No centro da Fenda, uma estrela consciente pulsa dentro de uma prisão feita de luz rachada e lembranças humanas.\nEla não fala com palavras: transmite imagens de um mundo destruído e de mãos que a acorrentaram para impedir que a ruína se espalhasse.\nOs selos começam a se partir, e cada fissura mostra um futuro diferente para Valedouro e para os desaparecidos.\nFragmentos estelares protegem o núcleo, não por ódio, mas por medo de serem aprisionados outra vez.\nA decisão final não será apenas derrotar uma criatura, mas compreender o preço de cada caminho antes que o cárcere desabe.", "Fragmentos estelares protegem o coração enquanto você decide como terminar o ritual.", "Sobreviva ao último teste e escolha o destino da estrela.", [
    enemy("c19_fragmento", "Fragmento Estelar", "normal", 480, 65, 225, 165, [{item:"cristal_arcano",chance:1}]),
    enemy("c19_oraculo", "Oráculo Despedaçado", "elite", 610, 73, 310, 225, [{item:"anel_sabio",chance:0.25}]),
    enemy("c19_coracao", "Coração da Estrela", "boss", 1120, 98, 800, 600, [{item:"selo_primordial",chance:1},{item:"elixir_total",chance:0.5}])
  ]],
  ["A Última Aurora", "O reino prende a respiração enquanto os três selos se encaixam e o sino de Valedouro toca através de montanhas, pântanos e cidades esquecidas.\nA corrupção reúne tudo o que roubou das pessoas desaparecidas e assume uma forma que muda a cada lembrança recuperada.\nDiante da estrela, as vozes dos sobreviventes ecoam como se estivessem ao seu lado, embora você esteja sozinho no centro da luz.\nHá mais de uma maneira de encerrar a Fenda, e nenhuma delas promete salvar tudo sem perdas.\nQuando a aurora surgir, o mundo será diferente; cabe a você escolher o que merece atravessar para o outro lado.", "A corrupção final toma forma para impedir sua decisão.", "Enfrente a manifestação final e determine o futuro de Valedouro.", [
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
