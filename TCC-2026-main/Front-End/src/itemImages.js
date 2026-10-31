const IMAGE_FILES = import.meta.glob("../imagens/*.png", { eager: true, import: "default" });

const normalize = (value) => String(value || "")
  .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const images = Object.fromEntries(Object.entries(IMAGE_FILES).map(([path, url]) => [
  normalize(path.split("/").pop().replace(/\\.png$/i, "")), url
]));

const aliases = {
  "Chave das Ruínas": "Chave das Ruinas",
  "Flor-da-Lua": "Flor da Lua",
  "Tônico de Energia": "Tônico de energia",
  "Vulto de Palha": "Espantalho",
  "Peitoral do Bastião": "Armadura do Bastião",
  "Peitoral do Colosso": "Armadura do Colosso",
  "Peitoral da Sombra": "Armadura da Sombra",
  "Peitoral do Espectro": "Armadura do Espectro",
  "Elmo da Trilha Lunar": "Capuz da Trilha Lunar",
  "Peitoral da Trilha Lunar": "Manto da Trilha Lunar",
  "Elmo do Falcão Celeste": "Capuz do Falcão Celeste",
  "Peitoral do Falcão Celeste": "Manto do Falcão Celeste",
  "Elmo do Astrolábio": "Chapéu do Astrolábio",
  "Peitoral do Astrolábio": "Manto do Astrolábio",
  "Elmo do Cometa Arcano": "Chapéu do Cometa Arcano",
  "Peitoral do Cometa Arcano": "Manto do Cometa Arcano",
  "Elmo da Sombra": "Capuz da Sombra",
  "Elmo do Espectro": "Capuz do Espectro",
  "Calças da Sombra": "Calça da Sombra",
  "Elmo da Trilha da Arqueira": "Elmo do Vigia",
  "Peitoral da Trilha da Arqueira": "Túnica Reforçada",
  "Calças da Trilha da Arqueira": "Calças de Couro",
  "Botas da Trilha da Arqueira": "Botas do Caçador",
  "Elmo do Guarda Novato": "Elmo do Vigia",
  "Peitoral do Guarda Novato": "Túnica Reforçada",
  "Calças do Guarda Novato": "Calças de Couro",
  "Botas do Guarda Novato": "Botas do Caçador",
  "Elmo da Aprendiz Arcana": "Chapéu do Astrolábio",
  "Peitoral da Aprendiz Arcana": "Manto do Arcanista",
  "Calças da Aprendiz Arcana": "Calças do Astrolábio",
  "Botas da Aprendiz Arcana": "Botas do Astrolábio",
  "Elmo do Batedor": "Capuz da Sombra",
  "Peitoral do Batedor": "Cota do Batedor",
  "Calças do Batedor": "Calça da Sombra",
  "Botas do Batedor": "Botas da Sombra"
};

const slotFallbacks = {
  helmet: ["Elmo do Vigia", "Capuz da Sombra"],
  chest: ["Túnica Reforçada", "Manto do Arcanista"],
  pants: ["Calças de Couro", "Calça da Sombra"],
  boots: ["Botas do Caçador", "Botas da Sombra"],
  shield: ["Escudo de Carvalho"],
  weapon: ["Espada do Aventureiro"],
  accessory: ["Anel do Vigor"],
  consumable: ["Poção de Vida"],
  material: ["Cristal Arcano"],
  quest: ["Selo Primordial"]
};

export function getItemImage(item) {
  if (!item) return null;
  if (item.icon && typeof item.icon === "string") return item.icon;
  const exact = images[normalize(item.name)];
  if (exact) return exact;
  const alias = aliases[item.name];
  if (alias && images[normalize(alias)]) return images[normalize(alias)];
  const type = item.type === "accessory" ? "accessory" : item.type;
  const fallback = (slotFallbacks[type] || []).map((name) => images[normalize(name)]).find(Boolean);
  return fallback || null;
}
