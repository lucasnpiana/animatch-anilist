"use strict";

/* =========================================================
   AniMatch — Anime Discovery
   Manifest V3 | AniList GraphQL
   Idiomas: PT / EN (textos em i18n.js)
   ========================================================= */

const API_URL = "https://graphql.anilist.co";
const REQUEST_TIMEOUT = 15000;
const TRANSLATE_TIMEOUT = 10000;
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
const synopsisTools = $("#synopsisTools");
const synopsisNote = $("#synopsisNote");
const synopsisToggleBtn = $("#synopsisToggleBtn");

const crunchyrollBtn = $("#crunchyrollBtn");
const dismissBtn = $("#dismissBtn");
const seenBtn = $("#seenBtn");
const watchlistBtn = $("#watchlistBtn");

const queueInfo = $("#queueInfo");
const savedList = $("#savedList");
const savedListCount = $("#savedListCount");
const savedListItems = $("#savedListItems");

const themeBtn = $("#themeBtn");
const langBtn = $("#langBtn");

/* =========================================================
   ERRORS (guardados como chave de tradução, para
   acompanhar a troca de idioma)
   ========================================================= */

class AppError extends Error {
  constructor(key, vars) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

const errorState = new Map();

function renderError(container) {
  const err = errorState.get(container);

  if (!err) return;

  container.textContent = err.key ? t(err.key, err.vars) : err.raw;
  container.classList.remove("hidden");
}

function setError(container, err) {
  errorState.set(container, err);
  renderError(container);
}

function clearError(container) {
  errorState.delete(container);

  container.textContent = "";
  container.classList.add("hidden");
}

/* =========================================================
   THEME
   ========================================================= */

const systemDarkQuery = matchMedia("(prefers-color-scheme: dark)");

function getSavedTheme() {
  try { return localStorage.getItem("animatchTheme"); } catch { return null; }
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme")
    || (systemDarkQuery.matches ? "dark" : "light");
}

function updateThemeButton() {
  const theme = currentTheme();

  themeBtn.textContent = theme === "dark" ? "\u2600\uFE0E" : "\u263E\uFE0E";
  themeBtn.title = theme === "dark" ? t("theme.toLight") : t("theme.toDark");
  themeBtn.setAttribute("aria-label", themeBtn.title);
}

function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute("data-theme", theme);

  updateThemeButton();

  if (persist) {
    try { localStorage.setItem("animatchTheme", theme); } catch {}
  }
}

applyTheme(getSavedTheme() || currentTheme(), false);

themeBtn.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
});

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
  showOriginal: false,

  seenIds: new Set(),
  dismissedIds: new Set(),
  watchlist: [],
  aniListAnimeIds: new Set(),
  swipeStartX: null,

  /* o que o cabeçalho de resultados deve mostrar */
  heading: { mode: "default" },

  /* perfil AniList */
  profileUser: null,
  profileSource: null,
  authMsgKey: null
};

let anilistToken = null;

chrome.storage.local.get(["animatchAniListToken", "animatchAniListUser", "animatchAniListAnimeIds", "animatchAniListSource"], (saved) => {
  anilistToken = saved.animatchAniListToken || null;
  state.aniListAnimeIds = new Set(saved.animatchAniListAnimeIds || []);
  if (saved.animatchAniListUser) {
    showConnectedProfile(saved.animatchAniListUser, saved.animatchAniListSource);
  }
});

chrome.storage.local.get(["animatchSeen", "animatchDismissed", "animatchWatchlist"], (saved) => {
  state.seenIds = new Set(saved.animatchSeen || []);
  state.dismissedIds = new Set(saved.animatchDismissed || []);
  state.watchlist = saved.animatchWatchlist || [];
  renderSavedList();
});

/* =========================================================
   LANGUAGE
   ========================================================= */

function updateLangButton() {
  langBtn.querySelectorAll(".lang-opt").forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.lang === currentLang);
  });

  langBtn.title = t("lang.switch");
  langBtn.setAttribute("aria-label", t("lang.switch"));
}

function refreshDynamicTexts() {
  applyStaticTranslations();
  updateThemeButton();
  updateLangButton();
  renderProfile();
  renderResultHeading();

  renderError(homeError);
  renderError(resultError);

  if (state.currentAnime && !animeCard.classList.contains("hidden")) {
    fillCard(state.currentAnime);
  }
}

function setLanguage(lang) {
  setLanguageValue(lang);

  state.showOriginal = false;
  failedTranslations.clear();

  refreshDynamicTexts();
}

langBtn.addEventListener("click", () => {
  setLanguage(currentLang === "pt" ? "en" : "pt");
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
      throw new AppError("err.invalidResponse", { status: response.status });
    }

    if (!response.ok || json.errors?.length) {
      const details = json.errors
        ?.map((error) => error.message)
        .join(" | ");

      if (details) {
        throw new Error(details);
      }

      throw new AppError("err.http", { status: response.status });
    }

    if (currentRequestId !== state.requestId) {
      throw new DOMException(
        "Requisição obsoleta.",
        "AbortError"
      );
    }

    if (!json.data) {
      throw new AppError("err.noData");
    }

    return json.data;

  } catch (error) {
    if (error.name === "AbortError") {
      if (timedOut) {
        throw new AppError("err.timeout");
      }

      throw error;
    }

    if (error instanceof TypeError) {
      throw new AppError("err.connection");
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
   Devolve texto puro ("" quando não há sinopse)
   ========================================================= */

function sanitizeDescription(description) {
  if (!description) {
    return "";
  }

  const parser = new DOMParser();

  const doc = parser.parseFromString(
    description,
    "text/html"
  );

  doc.querySelectorAll(
    "script, style, iframe, object, embed"
  ).forEach((element) => {
    element.remove();
  });

  doc.querySelectorAll("br").forEach((br) => {
    br.replaceWith(" ");
  });

  return (doc.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   SYNOPSIS TRANSLATION (EN -> PT-BR)
   1) Google Translate (endpoint público gtx)
   2) MyMemory como reserva
   ========================================================= */

const translationCache = new Map();
const pendingTranslations = new Set();
const failedTranslations = new Set();

function splitIntoChunks(text, maxLen) {
  const sentences = text.split(/(?<=[.!?…])\s+/);

  const chunks = [];
  let current = "";

  for (let sentence of sentences) {
    while (sentence.length > maxLen) {
      let cut = sentence.lastIndexOf(" ", maxLen);

      if (cut <= 0) cut = maxLen;

      if (current) {
        chunks.push(current);
        current = "";
      }

      chunks.push(sentence.slice(0, cut));
      sentence = sentence.slice(cut).trim();
    }

    if (!sentence) continue;

    if ((current + " " + sentence).trim().length > maxLen) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function translateChunkGoogle(chunk) {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    "?client=gtx&sl=en&tl=pt&dt=t&q=" +
    encodeURIComponent(chunk);

  const data = await fetchJson(url);

  if (!Array.isArray(data?.[0])) {
    throw new Error("Resposta de tradução inválida.");
  }

  return data[0].map((part) => part?.[0] || "").join("");
}

function decodeEntities(text) {
  const area = document.createElement("textarea");
  area.innerHTML = text;
  return area.value;
}

async function translateChunkMyMemory(chunk) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(chunk) +
    "&langpair=en%7Cpt-BR";

  const data = await fetchJson(url);
  const text = data?.responseData?.translatedText;

  if (Number(data?.responseStatus) !== 200 || !text) {
    throw new Error("Resposta de tradução inválida.");
  }

  return decodeEntities(text);
}

async function translateToPortuguese(text) {
  const join = (parts) => parts.join(" ").replace(/\s+/g, " ").trim();

  try {
    const parts = await Promise.all(
      splitIntoChunks(text, 1000).map(translateChunkGoogle)
    );

    return join(parts);
  } catch {
    const parts = await Promise.all(
      splitIntoChunks(text, 450).map(translateChunkMyMemory)
    );

    return join(parts);
  }
}

async function startTranslation(anime, original) {
  if (pendingTranslations.has(anime.id)) return;

  pendingTranslations.add(anime.id);

  try {
    const translated = await translateToPortuguese(original);

    translationCache.set(anime.id, translated);
  } catch {
    failedTranslations.add(anime.id);
  } finally {
    pendingTranslations.delete(anime.id);
  }

  if (state.currentAnime?.id === anime.id && currentLang === "pt") {
    renderSynopsis();
  }
}

function showSynopsisTools(note, toggleLabel) {
  synopsisNote.textContent = note;

  if (toggleLabel) {
    synopsisToggleBtn.textContent = toggleLabel;
    synopsisToggleBtn.classList.remove("hidden");
  } else {
    synopsisToggleBtn.classList.add("hidden");
  }

  synopsisTools.classList.remove("hidden");
}

function renderSynopsis() {
  const anime = state.currentAnime;

  if (!anime) return;

  const original = sanitizeDescription(anime.description);

  synopsisTools.classList.add("hidden");
  synopsisNote.textContent = "";

  if (!original) {
    animeSynopsis.textContent = t("synopsis.none");
    return;
  }

  /* Inglês: texto original, sem tradução */
  if (currentLang !== "pt") {
    animeSynopsis.textContent = original;
    synopsisWrapper.scrollTop = 0;
    return;
  }

  const cached = translationCache.get(anime.id);

  if (cached) {
    if (state.showOriginal) {
      animeSynopsis.textContent = original;
      showSynopsisTools(t("synopsis.original"), t("synopsis.showTranslation"));
    } else {
      animeSynopsis.textContent = cached;
      showSynopsisTools(t("synopsis.machine"), t("synopsis.showOriginal"));
    }

    synopsisWrapper.scrollTop = 0;
    return;
  }

  /* Ainda sem tradução: mostra o original e traduz em segundo plano */
  animeSynopsis.textContent = original;
  synopsisWrapper.scrollTop = 0;

  if (failedTranslations.has(anime.id)) {
    showSynopsisTools(t("synopsis.failed"), null);
    return;
  }

  showSynopsisTools(t("synopsis.translating"), null);
  startTranslation(anime, original);
}

synopsisToggleBtn.addEventListener("click", () => {
  state.showOriginal = !state.showOriginal;
  renderSynopsis();
});

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

  clearError(resultError);
  queueInfo.classList.add("hidden");

  [dismissBtn, seenBtn, watchlistBtn].forEach((button) => { button.disabled = true; });
}

function hideLoading() {
  loadingState.classList.add("hidden");

  [dismissBtn, seenBtn, watchlistBtn].forEach((button) => { button.disabled = false; });
}

/* =========================================================
   RESULT HEADING
   ========================================================= */

function renderResultHeading() {
  const heading = state.heading;

  if (heading.mode === "searching") {
    resultTitle.textContent = t("result.similarTitle");
    resultSubtitle.textContent = t("result.searching", { q: heading.query });
    return;
  }

  if (heading.mode === "similar") {
    resultTitle.textContent = t("result.similarTitle");
    resultSubtitle.textContent = t("result.basedOn", { name: heading.name });
    return;
  }

  if (heading.mode === "filter") {
    const parts = [];

    if (heading.genre) parts.push(t(`genre.${heading.genre}`));
    if (heading.duration) parts.push(t(`duration.${heading.duration}`));

    resultTitle.textContent = parts.join(" · ");
    resultSubtitle.textContent = t("result.filterSubtitle");
    return;
  }

  resultTitle.textContent = t("result.defaultTitle");
  resultSubtitle.textContent = "";
}

/* =========================================================
   SEARCH BY NAME
   ========================================================= */

async function searchAnimeByName(name) {
  const query = name.trim();

  if (!query) {
    setError(homeError, { key: "err.enterName" });

    return;
  }

  clearError(homeError);

  showLoading();

  state.heading = { mode: "searching", query };
  renderResultHeading();

  try {
    const searchData = await graphqlRequest(
      SEARCH_MEDIA_QUERY,
      {
        search: query
      }
    );

    const sourceAnime = searchData.Media;

    if (!sourceAnime) {
      throw new AppError("err.notFound");
    }

    state.heading = { mode: "similar", name: getAnimeTitle(sourceAnime) };
    renderResultHeading();

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
      throw new AppError("err.noRecs");
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
    setError(homeError, { key: "err.pickFilter" });

    return;
  }

  clearError(homeError);

  showLoading();

  state.heading = { mode: "filter", genre, duration };
  renderResultHeading();

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
      throw new AppError("err.noFilterResults");
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
    t("card.untitled")
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
  ).toLocaleString(currentLocale());
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
    return t("badge.anilist");
  }

  return t("badge.votes", { n: rating });
}

/* =========================================================
   RENDER CURRENT ANIME
   ========================================================= */

function renderQueueInfo() {
  queueInfo.textContent = t("queue.info", {
    i: state.currentIndex + 1,
    n: state.queue.length,
    w: state.watchlist.length
  });

  queueInfo.classList.remove("hidden");
}

/* Preenche o card com os textos do idioma atual */
function fillCard(anime) {
  animeTitle.textContent =
    getAnimeTitle(anime);

  animeNativeTitle.textContent =
    anime.title?.romaji || "";

  const cover = getAnimeCover(anime);

  if (cover) {
    if (animeCover.getAttribute("src") !== cover) {
      animeCover.src = cover;
    }
  } else {
    animeCover.removeAttribute("src");
  }

  animeCover.alt =
    t("card.coverAlt", { title: getAnimeTitle(anime) });

  animeCover.onerror = () => {
    animeCover.removeAttribute("src");
  };

  recommendationBadge.textContent =
    formatRecommendationRating(
      anime.recommendationRating
    );

  renderStats(anime);

  renderSynopsis();

  renderQueueInfo();
}

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
    setError(resultError, { key: "err.allSeen" });

    animeCard.classList.add("hidden");

    return;
  }

  state.currentAnime = anime;

  state.showOriginal = false;

  animeCard.classList.remove("hidden");

  fillCard(anime);

  synopsisWrapper.scrollTop = 0;
}

/* =========================================================
   RENDER STATISTICS
   ========================================================= */

function renderStats(anime) {
  const stats = [
    {
      label: t("stat.score"),
      value: formatScore(
        anime.meanScore
      )
    },

    {
      label: t("stat.popularity"),
      value: formatPopularity(
        anime.popularity
      )
    },

    {
      label: t("stat.episodes"),
      value: formatEpisodes(
        anime.episodes
      )
    },

    {
      label: t("stat.format"),
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
        const message = error.key ? t(error.key, error.vars) : error.message;
        setError(resultError, { key: "err.saveAniList", vars: { msg: message } });
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

  if (error instanceof AppError) {
    setError(resultError, { key: error.key, vars: error.vars });
    return;
  }

  if (error.message) {
    setError(resultError, { raw: error.message });
    return;
  }

  setError(resultError, { key: "err.unexpected" });
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

/* =========================================================
   ANILIST PROFILE
   ========================================================= */

function renderProfile() {
  if (state.profileUser) {
    const oauth = state.profileSource === "oauth";

    profileGreeting.textContent = t("profile.hello", { name: state.profileUser.name });
    authDescription.textContent = t(oauth ? "auth.descOauth" : "auth.descPublic");
    connectAniListBtn.textContent = t("auth.refresh");
    disconnectAniListBtn.classList.remove("hidden");
  } else {
    profileGreeting.textContent = "AniList";
    authDescription.textContent = t("auth.descDefault");
    connectAniListBtn.textContent = t("auth.connect");
    disconnectAniListBtn.classList.add("hidden");
  }

  connectAniListBtn.classList.remove("hidden");

  authMessage.textContent = state.authMsgKey ? t(state.authMsgKey) : "";
}

function showConnectedProfile(user, source) {
  const resolved = source || (anilistToken ? "oauth" : "public");

  state.profileUser = user;
  state.profileSource = resolved;
  state.authMsgKey = resolved === "oauth" ? "auth.msgOauth" : "auth.msgPublic";

  renderProfile();
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

  state.profileUser = null;
  state.profileSource = null;
  state.authMsgKey = "auth.disconnected";

  renderProfile();
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
  /* não vira "swipe" ao clicar em botões nem ao ler/selecionar a sinopse */
  if (event.target.closest("button, .synopsis-wrapper")) return;
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

crunchyrollBtn.addEventListener(
  "click",
  openCrunchyrollSearch
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

applyStaticTranslations();
updateThemeButton();
updateLangButton();
renderProfile();
renderResultHeading();

showView("home");