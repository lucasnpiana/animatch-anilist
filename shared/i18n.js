"use strict";

/* =========================================================
   AniMatch — Idiomas (PT / EN)
   Para adicionar ou editar um texto, mexa só neste arquivo.
   ========================================================= */

const I18N = {
  pt: {
    "doc.title": "AniMatch",

    "header.back": "Voltar",
    "header.profile": "Perfil e sobre o AniMatch",
    "theme.toLight": "Mudar para tema claro",
    "theme.toDark": "Mudar para tema escuro",
    "lang.switch": "Mudar idioma para inglês",

    "home.eyebrow": "SEU PRÓXIMO FAVORITO",
    "home.title": "Encontre seu próximo anime.",
    "home.subtitle": "Uma nova aventura começa com uma recomendação.",

    "search.label": "Qual anime você curtiu?",
    "search.placeholder": "Ex: Attack on Titan",
    "search.button": "Achar parecidos",
    "search.hint": "Recomendações oficiais da comunidade AniList.",

    "duration.title": "Quanto tempo você tem?",
    "duration.short": "Curto",
    "duration.medium": "Médio",
    "duration.long": "Maratona",
    "duration.hint": "Curto: 1–13 · Médio: 14–30 · Maratona: 31+",
    "duration.button": "Explorar por duração",

    "genre.title": "Escolha sua vibe",
    "genre.Action": "Ação",
    "genre.Psychological": "Psicológico",
    "genre.Comedy": "Comédia",
    "genre.Drama": "Drama",
    "genre.Fantasy": "Fantasia",
    "genre.Sci-Fi": "Sci-Fi",
    "genre.button": "Explorar essa vibe",

    "profile.eyebrow": "SEU ESPAÇO ANIMATCH",
    "profile.title": "Seu perfil otaku",
    "profile.subtitle": "Conecte sua conta para recomendações mais pessoais.",
    "profile.hello": "Olá, {name}!",
    "auth.descDefault": "Entre com o AniList para evitar recomendações de animes da sua lista e salvar títulos diretamente no seu perfil.",
    "auth.descOauth": "Conta conectada. Suas recomendações ignoram os animes da sua lista, e os títulos salvos podem ser enviados ao AniList.",
    "auth.descPublic": "Perfil público sincronizado. As recomendações ignoram os títulos da lista pública; novos salvos ficam na lista local do AniMatch.",
    "auth.connect": "Conectar com AniList",
    "auth.refresh": "Atualizar perfil ou conexão",
    "auth.disconnect": "Desconectar",
    "auth.msgOauth": "Conta AniList conectada.",
    "auth.msgPublic": "Sincronização pública ativa.",
    "auth.disconnected": "Conta desconectada.",

    "about.title": "Sobre o AniMatch",
    "about.p1": "O AniMatch ajuda você a encontrar seu próximo anime de acordo com o que já gosta, o tempo que tem e a vibe que procura.",
    "about.li1": "Recomendações da comunidade AniList",
    "about.li2": "Descoberta por similaridade, duração ou gênero",
    "about.li3": "Decisões rápidas: passar, já vi ou salvar",
    "about.note": "Projeto independente, feito com carinho por fãs de anime. Os dados de catálogo vêm da API GraphQL do AniList.",

    "result.eyebrow": "ANIMATCH DISCOVERY",
    "result.defaultTitle": "Sua próxima aventura",
    "result.similarTitle": "Animes parecidos",
    "result.searching": "Buscando recomendações para \"{q}\"...",
    "result.basedOn": "Recomendações baseadas em {name}.",
    "result.filterSubtitle": "Animes populares encontrados no AniList.",
    "loading": "Consultando o AniList...",

    "card.synopsis": "Sinopse",
    "card.coverAlt": "Capa de {title}",
    "card.dismiss": "Passar",
    "card.dismissTitle": "Não tenho interesse",
    "card.seen": "Já vi",
    "card.seenTitle": "Marcar como já visto",
    "card.watchlist": "Minha lista",
    "card.watchlistTitle": "Adicionar à minha lista",
    "card.matchLabel": "O que achou deste anime?",
    "card.swipeHint": "← passar · adicionar à lista →",
    "card.crunchyroll": "Assistir na Crunchyroll",
    "card.untitled": "Anime sem título",
    "badge.votes": "{n} Votos",
    "badge.anilist": "AniList",

    "stat.score": "Nota",
    "stat.popularity": "Popularidade",
    "stat.episodes": "Episódios",
    "stat.format": "Formato",

    "synopsis.none": "Sinopse não disponível.",
    "synopsis.translating": "Traduzindo sinopse...",
    "synopsis.machine": "Tradução automática",
    "synopsis.original": "Texto original (inglês)",
    "synopsis.failed": "Tradução indisponível agora. Mostrando o original em inglês.",
    "synopsis.showOriginal": "Ver original (EN)",
    "synopsis.showTranslation": "Ver tradução (PT)",

    "queue.info": "Anime {i} de {n} · {w} na sua lista",
    "saved.summary": "Minha lista",

    "err.enterName": "Digite o nome de um anime.",
    "err.notFound": "Anime não encontrado. Verifique o nome.",
    "err.noRecs": "Nenhuma recomendação comunitária encontrada.",
    "err.pickFilter": "Selecione uma duração ou uma vibe.",
    "err.noFilterResults": "Nenhum anime encontrado com esses filtros.",
    "err.allSeen": "Você passou por todos os animes desta seleção. Tente outra busca ou filtro.",
    "err.timeout": "O AniList demorou demais para responder. Tente novamente.",
    "err.connection": "Falha de conexão. Verifique sua internet.",
    "err.invalidResponse": "Resposta inválida do AniList: HTTP {status}",
    "err.http": "AniList respondeu com HTTP {status}.",
    "err.noData": "A API não retornou dados.",
    "err.unexpected": "Ocorreu um erro inesperado.",
    "err.saveAniList": "Não foi possível salvar no AniList: {msg}"
  },

  en: {
    "doc.title": "AniMatch",

    "header.back": "Back",
    "header.profile": "Profile and about AniMatch",
    "theme.toLight": "Switch to light theme",
    "theme.toDark": "Switch to dark theme",
    "lang.switch": "Switch language to Portuguese",

    "home.eyebrow": "YOUR NEXT FAVORITE",
    "home.title": "Find your next anime.",
    "home.subtitle": "A new adventure starts with a recommendation.",

    "search.label": "Which anime did you like?",
    "search.placeholder": "e.g. Attack on Titan",
    "search.button": "Find similar",
    "search.hint": "Official recommendations from the AniList community.",

    "duration.title": "How much time do you have?",
    "duration.short": "Short",
    "duration.medium": "Medium",
    "duration.long": "Marathon",
    "duration.hint": "Short: 1–13 · Medium: 14–30 · Marathon: 31+",
    "duration.button": "Explore by length",

    "genre.title": "Pick your vibe",
    "genre.Action": "Action",
    "genre.Psychological": "Psychological",
    "genre.Comedy": "Comedy",
    "genre.Drama": "Drama",
    "genre.Fantasy": "Fantasy",
    "genre.Sci-Fi": "Sci-Fi",
    "genre.button": "Explore this vibe",

    "profile.eyebrow": "YOUR ANIMATCH SPACE",
    "profile.title": "Your otaku profile",
    "profile.subtitle": "Connect your account for more personal recommendations.",
    "profile.hello": "Hi, {name}!",
    "auth.descDefault": "Sign in with AniList to avoid recommendations of anime already on your list and save titles straight to your profile.",
    "auth.descOauth": "Account connected. Your recommendations skip anime on your list, and saved titles can be sent to AniList.",
    "auth.descPublic": "Public profile synced. Recommendations skip titles on your public list; newly saved ones stay in AniMatch's local list.",
    "auth.connect": "Connect with AniList",
    "auth.refresh": "Refresh profile or connection",
    "auth.disconnect": "Disconnect",
    "auth.msgOauth": "AniList account connected.",
    "auth.msgPublic": "Public sync active.",
    "auth.disconnected": "Account disconnected.",

    "about.title": "About AniMatch",
    "about.p1": "AniMatch helps you find your next anime based on what you already like, how much time you have and the vibe you're after.",
    "about.li1": "AniList community recommendations",
    "about.li2": "Discover by similarity, length or genre",
    "about.li3": "Quick decisions: skip, seen it or save",
    "about.note": "Independent project, made with love by anime fans. Catalog data comes from the AniList GraphQL API.",

    "result.eyebrow": "ANIMATCH DISCOVERY",
    "result.defaultTitle": "Your next adventure",
    "result.similarTitle": "Similar anime",
    "result.searching": "Looking for recommendations for \"{q}\"...",
    "result.basedOn": "Recommendations based on {name}.",
    "result.filterSubtitle": "Popular anime found on AniList.",
    "loading": "Querying AniList...",

    "card.synopsis": "Synopsis",
    "card.coverAlt": "Cover of {title}",
    "card.dismiss": "Skip",
    "card.dismissTitle": "Not interested",
    "card.seen": "Seen it",
    "card.seenTitle": "Mark as seen",
    "card.watchlist": "My list",
    "card.watchlistTitle": "Add to my list",
    "card.matchLabel": "What do you think of this anime?",
    "card.swipeHint": "← skip · add to list →",
    "card.crunchyroll": "Watch on Crunchyroll",
    "card.untitled": "Untitled anime",
    "badge.votes": "{n} Votes",
    "badge.anilist": "AniList",

    "stat.score": "Score",
    "stat.popularity": "Popularity",
    "stat.episodes": "Episodes",
    "stat.format": "Format",

    "synopsis.none": "Synopsis not available.",
    "synopsis.translating": "Translating synopsis...",
    "synopsis.machine": "Machine translation",
    "synopsis.original": "Original text (English)",
    "synopsis.failed": "Translation unavailable right now. Showing the English original.",
    "synopsis.showOriginal": "Show original (EN)",
    "synopsis.showTranslation": "Show translation (PT)",

    "queue.info": "Anime {i} of {n} · {w} on your list",
    "saved.summary": "My list",

    "err.enterName": "Type an anime name.",
    "err.notFound": "Anime not found. Check the name.",
    "err.noRecs": "No community recommendations found.",
    "err.pickFilter": "Pick a length or a vibe.",
    "err.noFilterResults": "No anime found with these filters.",
    "err.allSeen": "You've gone through every anime in this selection. Try another search or filter.",
    "err.timeout": "AniList took too long to respond. Please try again.",
    "err.connection": "Connection failed. Check your internet.",
    "err.invalidResponse": "Invalid response from AniList: HTTP {status}",
    "err.http": "AniList responded with HTTP {status}.",
    "err.noData": "The API returned no data.",
    "err.unexpected": "An unexpected error occurred.",
    "err.saveAniList": "Couldn't save to AniList: {msg}"
  }
};

/* =========================================================
   Idioma atual
   ========================================================= */

function detectLanguage() {
  try {
    const saved = localStorage.getItem("animatchLang");
    if (saved === "pt" || saved === "en") return saved;
  } catch {}

  const nav = (navigator.language || "pt").toLowerCase();
  return nav.startsWith("pt") ? "pt" : "en";
}

let currentLang = detectLanguage();

function setLanguageValue(lang) {
  currentLang = lang === "en" ? "en" : "pt";
  try { localStorage.setItem("animatchLang", currentLang); } catch {}
}

function t(key, vars) {
  let text = I18N[currentLang]?.[key] ?? I18N.pt[key] ?? key;

  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  return text;
}

function currentLocale() {
  return currentLang === "pt" ? "pt-BR" : "en-US";
}

/* Aplica os textos nos elementos com data-i18n* do HTML */
function applyStaticTranslations() {
  document.documentElement.lang = currentLang === "pt" ? "pt-BR" : "en";
  document.title = t("doc.title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const text = t(el.dataset.i18nTitle);
    el.title = text;
    el.setAttribute("aria-label", text);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
}