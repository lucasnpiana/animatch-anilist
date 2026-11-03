
"use strict";

/* =========================================================
   AniMatch — Anime Discovery
   Manifest V3 | AniList GraphQL
   ========================================================= */

const API_URL = "https://graphql.anilist.co";
const REQUEST_TIMEOUT = 15000;
const PAGE_SIZE = 25;

/* =========================================================
   DOM
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const homeView = $("#homeView");
const resultView = $("#resultView");
const profileView = $("#profileView");

const backBtn = $("#backBtn");
const quickSearchBtn = $("#quickSearchBtn");
const connectAniListBtn = $("#connectAniListBtn");
const disconnectAniListBtn = $("#disconnectAniListBtn");
const authMessage = $("#authMessage");
const authDescription = $("#authDescription");
const profileGreeting = $("#profileGreeting");

const searchForm = $("#searchForm");
const animeSearch = $("#animeSearch");

const durationChips = $("#durationChips");
const genreChips = $("#genreChips");

const durationSearchBtn = $("#durationSearchBtn");
const genreSearchBtn = $("#genreSearchBtn");

const homeError = $("#homeError");
const resultError = $("#resultError");

const resultTitle = $("#resultTitle");
const resultSubtitle = $("#resultSubtitle");

const loadingState = $("#loadingState");
const animeCard = $("#animeCard");

const animeCover = $("#animeCover");
const animeTitle = $("#animeTitle");
const animeNativeTitle = $("#animeNativeTitle");

const recommendationBadge = $("#recommendationBadge");
const animeStats = $("#animeStats");

const animeSynopsis = $("#animeSynopsis");
const synopsisWrapper = $("#synopsisWrapper");
const readMoreBtn = $("#readMoreBtn");

const crunchyrollBtn = $("#crunchyrollBtn");
const dismissBtn = $("#dismissBtn");
const seenBtn = $("#seenBtn");
const watchlistBtn = $("#watchlistBtn");

const queueInfo = $("#queueInfo");
const savedList = $("#savedList");
const savedListCount = $("#savedListCount");
const savedListItems = $("#savedListItems");

/* =========================================================
   STATE
   ========================================================= */

const state = {
  currentView: "home",

  selectedDuration: null,
  selectedGenre: null,

  queue: [],
  currentIndex: 0,

  requestController: null,
  requestId: 0,

  currentAnime: null,
  synopsisExpanded: false,
  seenIds: new Set(),
  dismissedIds: new Set(),
  watchlist: [],
  aniListAnimeIds: new Set(),
  swipeStartX: null
};

let anilistToken = null;

chrome.storage.local.get(["animatchAniListToken", "animatchAniListUser", "animatchAniListAnimeIds", "animatchAniListSource"], (saved) => {
  anilistToken = saved.animatchAniListToken || null;
  state.aniListAnimeIds = new Set(saved.animatchAniListAnimeIds || []);
  if (saved.animatchAniListUser) showConnectedProfile(saved.animatchAniListUser, saved.animatchAniListSource);
});

chrome.storage.local.get(["animatchSeen", "animatchDismissed", "animatchWatchlist"], (saved) => {
  state.seenIds = new Set(saved.animatchSeen || []);
  state.dismissedIds = new Set(saved.animatchDismissed || []);
  state.watchlist = saved.animatchWatchlist || [];
  renderSavedList();
});

/* =========================================================
   GRAPHQL MEDIA FIELDS
   ========================================================= */

const MEDIA_FIELDS = `
  id

  title {
    romaji
    english
  }

  coverImage {
    extraLarge
    large
  }

  bannerImage
  meanScore
  popularity
  description(asHtml: true)
  episodes
  format
`;

/* =========================================================
   GRAPHQL: SEARCH ANIME
   ========================================================= */

const SEARCH_MEDIA_QUERY = `
  query SearchAnime($search: String!) {
    Media(
      search: $search
      type: ANIME
      isAdult: false
    ) {
      ${MEDIA_FIELDS}
    }
  }
`;

/* =========================================================
   GRAPHQL: COMMUNITY RECOMMENDATIONS
   ========================================================= */

const RECOMMENDATIONS_QUERY = `
  query AnimeRecommendations($id: Int!) {
    Media(id: $id, type: ANIME) {
      id

      title {
        romaji
        english
      }

      recommendations(
        sort: RATING_DESC
        perPage: ${PAGE_SIZE}
      ) {
        nodes {
          rating

          mediaRecommendation {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  }
`;

/* =========================================================
   GRAPHQL REQUEST
   ========================================================= */

async function graphqlRequest(query, variables = {}) {
  if (state.requestController) {
    state.requestController.abort();
  }

  const controller = new AbortController();

  state.requestController = controller;

  const currentRequestId = ++state.requestId;

  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(anilistToken ? { Authorization: `Bearer ${anilistToken}` } : {})
      },

      body: JSON.stringify({
        query,
        variables
      }),

      signal: controller.signal
    });

    let json;

    try {
      json = await response.json();
    } catch {
      throw new Error(
        `Resposta inválida do AniList: HTTP ${response.status}`
      );
    }

    if (!response.ok || json.errors?.length) {
      const details = json.errors
        ?.map((error) => error.message)
        .join(" | ");

      throw new Error(
        details ||
        `AniList respondeu com HTTP ${response.status}.`
      );
    }

    if (currentRequestId !== state.requestId) {
      throw new DOMException(
        "Requisição obsoleta.",
        "AbortError"
      );
    }

    if (!json.data) {
      throw new Error(
        "A API não retornou dados."
      );
    }

    return json.data;

  } catch (error) {
    if (error.name === "AbortError") {
      if (timedOut) {
        throw new Error(
          "O AniList demorou demais para responder. Tente novamente."
        );
      }

      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Falha de conexão. Verifique sua internet."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);

    if (state.requestController === controller) {
      state.requestController = null;
    }
  }
}

/* =========================================================
   SANITIZE DESCRIPTION
   ========================================================= */

function sanitizeDescription(description) {
  if (!description) {
    return "Sinopse não disponível.";
  }

  const parser = new DOMParser();

  const document = parser.parseFromString(
    description,
    "text/html"
  );

  document.querySelectorAll(
    "script, style, iframe, object, embed"
  ).forEach((element) => {
    element.remove();
  });

  return (document.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   VIEW MANAGEMENT
   ========================================================= */

function showView(viewName) {
  state.currentView = viewName;

  homeView.classList.toggle(
    "hidden",
    viewName !== "home"
  );

  resultView.classList.toggle(
    "hidden",
    viewName !== "result"
  );

  profileView.classList.toggle("hidden", viewName !== "profile");

  backBtn.classList.toggle(
    "hidden",
    viewName === "home"
  );
}

function showLoading() {
  showView("result");

  loadingState.classList.remove("hidden");

  animeCard.classList.add("hidden");

  resultError.classList.add("hidden");
  queueInfo.classList.add("hidden");

  [dismissBtn, seenBtn, watchlistBtn].forEach((button) => { button.disabled = true; });
}

function hideLoading() {
  loadingState.classList.add("hidden");

  [dismissBtn, seenBtn, watchlistBtn].forEach((button) => { button.disabled = false; });
}

function showError(container, message) {
  container.textContent = message;

  container.classList.remove("hidden");
}

function clearError(container) {
  container.textContent = "";

  container.classList.add("hidden");
}

/* =========================================================
   SEARCH BY NAME
   ========================================================= */

async function searchAnimeByName(name) {
  const query = name.trim();

  if (!query) {
    showError(
      homeError,
      "Digite o nome de um anime."
    );

    return;
  }

  clearError(homeError);

  showLoading();

  resultTitle.textContent = "Animes parecidos";

  resultSubtitle.textContent =
    `Buscando recomendações para "${query}"...`;

  try {
    const searchData = await graphqlRequest(
      SEARCH_MEDIA_QUERY,
      {
        search: query
      }
    );

    const sourceAnime = searchData.Media;

    if (!sourceAnime) {
      throw new Error(
        "Anime não encontrado. Verifique o nome."
      );
    }

    resultSubtitle.textContent =
      `Recomendações baseadas em ${getAnimeTitle(sourceAnime)}.`;

    const recommendationData = await graphqlRequest(
      RECOMMENDATIONS_QUERY,
      {
        id: sourceAnime.id
      }
    );

    const nodes =
      recommendationData.Media
        ?.recommendations
        ?.nodes || [];

    const recommendations = nodes
      .filter((node) => node.mediaRecommendation)
      .map((node) => ({
        ...node.mediaRecommendation,

        recommendationRating: node.rating
      }));

    if (!recommendations.length) {
      throw new Error(
        "Nenhuma recomendação comunitária encontrada."
      );
    }

    state.queue = recommendations;

    state.currentIndex = 0;

    renderCurrentAnime();

  } catch (error) {
    handleRequestError(error);
  }
}

/* =========================================================
   BUILD FILTER QUERY DYNAMICALLY
   ========================================================= */

function buildFilterQuery(genre, duration) {
  const declarations = [];
  const argumentsList = [];

  const variables = {};

  /* Genre */

  if (genre) {
    declarations.push("$genres: [String]");

    argumentsList.push(
      "genre_in: $genres"
    );

    variables.genres = [genre];
  }

  /* Short: 1–13 episodes */

  if (duration === "short") {
    declarations.push(
      "$episodesLesser: Int"
    );

    argumentsList.push(
      "episodes_lesser: $episodesLesser"
    );

    variables.episodesLesser = 14;
  }

  /* Medium: 14–30 episodes */

  if (duration === "medium") {
    declarations.push(
      "$episodesGreater: Int"
    );

    declarations.push(
      "$episodesLesser: Int"
    );

    argumentsList.push(
      "episodes_greater: $episodesGreater"
    );

    argumentsList.push(
      "episodes_lesser: $episodesLesser"
    );

    variables.episodesGreater = 13;
    variables.episodesLesser = 31;
  }

  /* Marathon: 31+ episodes */

  if (duration === "long") {
    declarations.push(
      "$episodesGreater: Int"
    );

    argumentsList.push(
      "episodes_greater: $episodesGreater"
    );

    variables.episodesGreater = 30;
  }

  const variableDeclaration =
    declarations.length > 0
      ? `(${declarations.join(", ")})`
      : "";

  const mediaArguments = [
    "type: ANIME",
    ...argumentsList,
    "sort: POPULARITY_DESC",
    "isAdult: false"
  ].join("\n");

  const query = `
    query FilterAnime ${variableDeclaration} {
      Page(page: 1, perPage: ${PAGE_SIZE}) {
        media(
          ${mediaArguments}
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  return {
    query,
    variables
  };
}

/* =========================================================
   SEARCH BY FILTERS
   ========================================================= */

async function searchByFilters() {
  const genre = state.selectedGenre;

  const duration = state.selectedDuration;

  if (!genre && !duration) {
    showError(
      homeError,
      "Selecione uma duração ou uma vibe."
    );

    return;
  }

  clearError(homeError);

  showLoading();

  const durationLabels = {
    short: "Curto",
    medium: "Médio",
    long: "Maratona"
  };

  const titleParts = [];

  if (genre) {
    titleParts.push(genre);
  }

  if (duration) {
    titleParts.push(
      durationLabels[duration]
    );
  }

  resultTitle.textContent =
    titleParts.join(" · ");

  resultSubtitle.textContent =
    "Animes populares encontrados no AniList.";

  try {
    const { query, variables } =
      buildFilterQuery(
        genre,
        duration
      );

    const data = await graphqlRequest(
      query,
      variables
    );

    const results =
      data.Page?.media || [];

    if (!results.length) {
      throw new Error(
        "Nenhum anime encontrado com esses filtros."
      );
    }

    state.queue = results.map((anime) => ({
      ...anime,

      recommendationRating: null
    }));

    state.currentIndex = 0;

    renderCurrentAnime();

  } catch (error) {
    handleRequestError(error);
  }
}

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

function getAnimeTitle(anime) {
  return (
    anime.title?.english ||
    anime.title?.romaji ||
    "Anime sem título"
  );
}

function getAnimeCover(anime) {
  return (
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.bannerImage ||
    ""
  );
}

function formatScore(score) {
  if (score == null) {
    return "N/A";
  }

  return (score / 10).toFixed(1);
}

function formatPopularity(popularity) {
  if (popularity == null) {
    return "N/A";
  }

  return Number(
    popularity
  ).toLocaleString("pt-BR");
}

function formatEpisodes(episodes) {
  return episodes == null
    ? "N/A"
    : String(episodes);
}

function formatFormat(format) {
  if (!format) {
    return "N/A";
  }

  return format.replaceAll(
    "_",
    " "
  );
}

function formatRecommendationRating(rating) {
  if (rating == null) {
    return "AniList";
  }

  return `${rating} Votos`;
}

/* =========================================================
   RENDER CURRENT ANIME
   ========================================================= */

function renderCurrentAnime() {
  hideLoading();

  clearError(resultError);

  while (state.currentIndex < state.queue.length &&
    (state.seenIds.has(state.queue[state.currentIndex].id) ||
     state.dismissedIds.has(state.queue[state.currentIndex].id) ||
     state.aniListAnimeIds.has(state.queue[state.currentIndex].id))) {
    state.currentIndex++;
  }

  const anime = state.queue[state.currentIndex];

  if (!anime) {
    showError(resultError, "Você passou por todos os animes desta seleção. Tente outra busca ou filtro.");

    animeCard.classList.add("hidden");

    return;
  }

  state.currentAnime = anime;

  state.synopsisExpanded = false;

  animeCard.classList.remove("hidden");

  animeTitle.textContent =
    getAnimeTitle(anime);

  animeNativeTitle.textContent =
    anime.title?.romaji || "";

  const cover = getAnimeCover(anime);

  if (cover) {
    animeCover.src = cover;
  } else {
    animeCover.removeAttribute("src");
  }

  animeCover.alt =
    `Capa de ${getAnimeTitle(anime)}`;

  animeCover.onerror = () => {
    animeCover.removeAttribute("src");
  };

  recommendationBadge.textContent =
    formatRecommendationRating(
      anime.recommendationRating
    );

  renderStats(anime);

  animeSynopsis.textContent =
    sanitizeDescription(
      anime.description
    );

  synopsisWrapper.classList.remove(
    "expanded"
  );

  readMoreBtn.textContent =
    "Ler Mais ↓";

  readMoreBtn.setAttribute(
    "aria-expanded",
    "false"
  );

  readMoreBtn.classList.add(
    "hidden"
  );

  queueInfo.textContent =
    `Anime ${state.currentIndex + 1} de ${state.queue.length} · ${state.watchlist.length} na sua lista`;

  queueInfo.classList.remove(
    "hidden"
  );

  requestAnimationFrame(() => {
    const needsExpansion =
      animeSynopsis.scrollHeight >
      synopsisWrapper.clientHeight + 2;

    readMoreBtn.classList.toggle(
      "hidden",
      !needsExpansion
    );
  });
}

/* =========================================================
   RENDER STATISTICS
   ========================================================= */

function renderStats(anime) {
  const stats = [
    {
      label: "Nota",
      value: formatScore(
        anime.meanScore
      )
    },

    {
      label: "Popularidade",
      value: formatPopularity(
        anime.popularity
      )
    },

    {
      label: "Episódios",
      value: formatEpisodes(
        anime.episodes
      )
    },

    {
      label: "Formato",
      value: formatFormat(
        anime.format
      )
    }
  ];

  animeStats.replaceChildren();

  for (const stat of stats) {
    const container =
      document.createElement("div");

    container.className = "stat";

    const label =
      document.createElement("span");

    label.className = "stat-label";

    label.textContent =
      stat.label;

    const value =
      document.createElement("span");

    value.className = "stat-value";

    value.textContent =
      stat.value;

    container.append(
      label,
      value
    );

    animeStats.appendChild(
      container
    );
  }
}

/* =========================================================
   NEXT RECOMMENDATION
   ========================================================= */

function nextRecommendation() {
  if (!state.queue.length) {
    return;
  }

  state.currentIndex++;

  renderCurrentAnime();
}

function savePreference(key, values) {
  chrome.storage.local.set({ [key]: values });
}

function renderSavedList() {
  savedListCount.textContent = String(state.watchlist.length);
  savedList.classList.toggle("hidden", state.watchlist.length === 0);
  savedListItems.replaceChildren();
  for (const item of state.watchlist) {
    const li = document.createElement("li");
    li.textContent = item.title;
    savedListItems.appendChild(li);
  }
}

async function rateCurrentAnime(action) {
  const anime = state.currentAnime;
  if (!anime) return;

  if (action === "seen") {
    state.seenIds.add(anime.id);
    savePreference("animatchSeen", [...state.seenIds]);
  } else if (action === "dismiss") {
    state.dismissedIds.add(anime.id);
    savePreference("animatchDismissed", [...state.dismissedIds]);
  } else if (action === "watchlist") {
    if (anilistToken) {
      try {
        const mutation = `mutation($mediaId: Int, $status: MediaListStatus) { SaveMediaListEntry(mediaId: $mediaId, status: $status) { id status } }`;
        await graphqlRequest(mutation, { mediaId: anime.id, status: "PLANNING" });
        state.aniListAnimeIds.add(anime.id);
        chrome.storage.local.set({ animatchAniListAnimeIds: [...state.aniListAnimeIds] });
      } catch (error) {
        showError(resultError, `Não foi possível salvar no AniList: ${error.message}`);
        return;
      }
    }
    if (!state.watchlist.some((item) => item.id === anime.id)) {
      state.watchlist.push({ id: anime.id, title: getAnimeTitle(anime), cover: getAnimeCover(anime) });
      savePreference("animatchWatchlist", state.watchlist);
      renderSavedList();
    }
  }

  nextRecommendation();
}

function handleCardSwipe(event) {
  if (state.swipeStartX == null || !state.currentAnime) return;
  const delta = event.clientX - state.swipeStartX;
  state.swipeStartX = null;
  if (Math.abs(delta) < 70) return;
  rateCurrentAnime(delta < 0 ? "dismiss" : "watchlist");
}

/* =========================================================
   ERROR HANDLING
   ========================================================= */

function handleRequestError(error) {
  hideLoading();

  animeCard.classList.add(
    "hidden"
  );

  if (error.name === "AbortError") {
    return;
  }

  showError(
    resultError,

    error.message ||
    "Ocorreu um erro inesperado."
  );
}

/* =========================================================
   CRUNCHYROLL
   ========================================================= */

function openCrunchyrollSearch() {
  if (!state.currentAnime) {
    return;
  }

  const title =
    getAnimeTitle(
      state.currentAnime
    );

  const url =
    "https://www.crunchyroll.com/search?q=" +
    encodeURIComponent(title);

  chrome.tabs.create({
    url,
    active: true
  });
}

const VIEWER_QUERY = `query { Viewer { id name avatar { large } } }`;

function showConnectedProfile(user, source = anilistToken ? "oauth" : "public") {
  profileGreeting.textContent = `Olá, ${user.name}!`;
  authDescription.textContent = source === "oauth"
    ? "Conta conectada. Suas recomendações ignoram os animes da sua lista, e os títulos salvos podem ser enviados ao AniList."
    : "Perfil público sincronizado. As recomendações ignoram os títulos da lista pública; novos salvos ficam na lista local do AniMatch.";
  connectAniListBtn.textContent = "Atualizar perfil ou conexão";
  disconnectAniListBtn.classList.remove("hidden");
  authMessage.textContent = source === "oauth" ? "Conta AniList conectada." : "Sincronização pública ativa.";
}

async function connectAniList() {
  chrome.tabs.create({ url: chrome.runtime.getURL("auth.html") });
}

function disconnectAniList() {
  anilistToken = null;
  state.aniListAnimeIds.clear();
  chrome.storage.local.remove([
    "animatchAniListToken", "animatchAniListUser", "animatchAniListProfile",
    "animatchAniListAnimeIds", "animatchAniListEntries", "animatchAniListSyncedAt", "animatchAniListSource"
  ]);
  profileGreeting.textContent = "AniList";
  authDescription.textContent = "Entre com o AniList para evitar recomendações de animes da sua lista e salvar títulos diretamente no seu perfil.";
  authMessage.textContent = "Conta desconectada.";
  disconnectAniListBtn.classList.add("hidden");
  connectAniListBtn.classList.remove("hidden");
  connectAniListBtn.textContent = "Conectar com AniList";
}

/* =========================================================
   SYNOPSIS EXPANSION
   ========================================================= */

function toggleSynopsis() {
  state.synopsisExpanded =
    !state.synopsisExpanded;

  synopsisWrapper.classList.toggle(
    "expanded",
    state.synopsisExpanded
  );

  readMoreBtn.setAttribute(
    "aria-expanded",

    String(
      state.synopsisExpanded
    )
  );

  readMoreBtn.textContent =
    state.synopsisExpanded
      ? "Ler Menos ↑"
      : "Ler Mais ↓";
}

/* =========================================================
   DURATION CHIPS
   ========================================================= */

durationChips.addEventListener(
  "click",

  (event) => {
    const chip =
      event.target.closest(
        "[data-duration]"
      );

    if (!chip) {
      return;
    }

    const value =
      chip.dataset.duration;

    state.selectedDuration =
      state.selectedDuration === value
        ? null
        : value;

    durationChips
      .querySelectorAll(
        "[data-duration]"
      )
      .forEach((button) => {
        button.classList.toggle(
          "selected",

          button.dataset.duration ===
            state.selectedDuration
        );
      });

    clearError(homeError);
  }
);

/* =========================================================
   GENRE CHIPS
   ========================================================= */

genreChips.addEventListener(
  "click",

  (event) => {
    const chip =
      event.target.closest(
        "[data-genre]"
      );

    if (!chip) {
      return;
    }

    const value =
      chip.dataset.genre;

    state.selectedGenre =
      state.selectedGenre === value
        ? null
        : value;

    genreChips
      .querySelectorAll(
        "[data-genre]"
      )
      .forEach((button) => {
        button.classList.toggle(
          "selected",

          button.dataset.genre ===
            state.selectedGenre
        );
      });

    clearError(homeError);
  }
);

/* =========================================================
   SEARCH FORM
   ========================================================= */

searchForm.addEventListener(
  "submit",

  (event) => {
    event.preventDefault();

    searchAnimeByName(
      animeSearch.value
    );
  }
);

/* =========================================================
   BUTTON EVENTS
   ========================================================= */

durationSearchBtn.addEventListener(
  "click",
  searchByFilters
);

genreSearchBtn.addEventListener(
  "click",
  searchByFilters
);

dismissBtn.addEventListener("click", () => rateCurrentAnime("dismiss"));
seenBtn.addEventListener("click", () => rateCurrentAnime("seen"));
watchlistBtn.addEventListener("click", () => rateCurrentAnime("watchlist"));
animeCard.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  state.swipeStartX = event.clientX;
});
animeCard.addEventListener("pointerup", handleCardSwipe);
animeCard.addEventListener("pointercancel", () => { state.swipeStartX = null; });

backBtn.addEventListener(
  "click",

  () => {
    if (state.requestController) {
      state.requestController.abort();

      state.requestController = null;
    }

    state.requestId++;

    hideLoading();

    showView("home");
  }
);

quickSearchBtn.addEventListener(
  "click",

  () => {
    showView("profile");
  }
);

connectAniListBtn.addEventListener("click", connectAniList);
disconnectAniListBtn.addEventListener("click", disconnectAniList);

readMoreBtn.addEventListener(
  "click",
  toggleSynopsis
);

crunchyrollBtn.addEventListener(
  "click",
  openCrunchyrollSearch
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

showView("home");
