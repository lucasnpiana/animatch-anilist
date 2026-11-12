"use strict";

const API_URL = "https://graphql.anilist.co";
const clientIdInput = document.querySelector("#clientId");
const redirectUri = chrome.identity.getRedirectURL();
const status = document.querySelector("#status");
const loginBtn = document.querySelector("#loginBtn");
const profileInput = document.querySelector("#profileInput");
const publicStatus = document.querySelector("#publicStatus");
const syncPublicBtn = document.querySelector("#syncPublicBtn");
document.querySelector("#redirectUri").textContent = redirectUri;

chrome.storage.local.get(["animatchAniListClientId", "animatchAniListUser", "animatchAniListProfile"], (data) => {
  clientIdInput.value = data.animatchAniListClientId || "";
  profileInput.value = data.animatchAniListProfile || "";
  if (data.animatchAniListUser) publicStatus.textContent = `Perfil sincronizado: ${data.animatchAniListUser.name}.`;
});

async function graphql(query, token, variables = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ query, variables })
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length) throw new Error(result.errors?.[0]?.message || `AniList respondeu com HTTP ${response.status}.`);
    return result.data;
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Falha de conexão com o AniList. Verifique a internet e tente novamente.");
    throw error;
  }
}

function getAniListUsername(value) {
  const input = value.trim();
  if (!input) throw new Error("Informe o nome de usuário ou link do perfil.");
  if (!/^https?:\/\//i.test(input)) return input.replace(/^@/, "").replace(/\/$/, "");
  const url = new URL(input);
  if (!/(^|\.)anilist\.co$/i.test(url.hostname)) throw new Error("Use um link de perfil do anilist.co.");
  const parts = url.pathname.split("/").filter(Boolean);
  const userIndex = parts.findIndex((part) => part.toLowerCase() === "user");
  if (userIndex < 0 || !parts[userIndex + 1]) throw new Error("Não encontrei o nome de usuário nesse link.");
  return decodeURIComponent(parts[userIndex + 1]);
}

async function syncPublicProfile() {
  let username;
  try { username = getAniListUsername(profileInput.value); }
  catch (error) { publicStatus.textContent = error.message; publicStatus.scrollIntoView({ block: "nearest" }); return; }

  syncPublicBtn.disabled = true;
  publicStatus.textContent = "Buscando lista pública no AniList…";
  try {
    const userQuery = `query($name: String) { User(name: $name) { id name } }`;
    const user = (await graphql(userQuery, null, { name: username })).User;
    if (!user) throw new Error("Perfil não encontrado. Confira o nome ou deixe a lista pública.");

    const listQuery = `query($userName: String, $type: MediaType!) { MediaListCollection(userName: $userName, type: $type) { lists { name entries { status score media { id title { romaji english } } } } } }`;
    const collection = (await graphql(listQuery, null, { userName: user.name, type: "ANIME" })).MediaListCollection;
    if (!collection) throw new Error("A lista está privada ou indisponível. Confira as configurações de privacidade do AniList.");
    const entries = collection.lists.flatMap((list) => list.entries.map((entry) => ({
      id: entry.media.id,
      title: entry.media.title.english || entry.media.title.romaji || "Anime sem título",
      status: entry.status,
      score: entry.score,
      list: list.name
    })));
    await chrome.storage.local.set({
      animatchAniListProfile: profileInput.value.trim(),
      animatchAniListUser: { id: user.id, name: user.name },
      animatchAniListAnimeIds: [...new Set(entries.map((entry) => entry.id))],
      animatchAniListEntries: entries,
      animatchAniListSyncedAt: new Date().toISOString(),
      animatchAniListSource: "public"
    });
    await chrome.storage.local.remove("animatchAniListToken");
    publicStatus.textContent = `${entries.length} animes sincronizados de ${user.name}. Pode fechar esta aba.`;
  } catch (error) {
    publicStatus.textContent = error.message || "Não foi possível sincronizar o perfil.";
  } finally {
    syncPublicBtn.disabled = false;
    publicStatus.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

async function connect() {
  const clientId = clientIdInput.value.trim();
  if (!clientId) {
    status.textContent = "Informe o Client ID do aplicativo AniList. O redirect acima precisa estar cadastrado nas configurações desse aplicativo.";
    clientIdInput.focus();
    return;
  }

  chrome.storage.local.set({ animatchAniListClientId: clientId });
  loginBtn.disabled = true;
  status.textContent = "Aguardando autorização do AniList…";
  try {
    const authUrl = new URL("https://anilist.co/api/v2/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "token");
    const callback = await chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true });
    const params = new URLSearchParams(new URL(callback).hash.slice(1));
    const token = params.get("access_token");
    if (!token) throw new Error("O AniList não retornou a autorização. Confira o Client ID e o endereço de retorno cadastrado.");

    status.textContent = "Autorizado. Sincronizando sua lista de animes…";
    const query = `query { Viewer { id name } }`;
    const viewer = (await graphql(query, token)).Viewer;
    const listQuery = `query($userId: Int) { MediaListCollection(userId: $userId, type: ANIME) { lists { name entries { status score media { id title { romaji english } } } } } }`;
    const collection = (await graphql(listQuery, token, { userId: viewer.id })).MediaListCollection;
    const entries = collection.lists.flatMap((list) => list.entries.map((entry) => ({
      id: entry.media.id,
      title: entry.media.title.english || entry.media.title.romaji || "Anime sem título",
      status: entry.status,
      score: entry.score,
      list: list.name
    })));

    await chrome.storage.local.set({
      animatchAniListToken: token,
      animatchAniListUser: { id: viewer.id, name: viewer.name },
      animatchAniListAnimeIds: [...new Set(entries.map((entry) => entry.id))],
      animatchAniListEntries: entries,
      animatchAniListSyncedAt: new Date().toISOString(),
      animatchAniListSource: "oauth"
    });
    status.textContent = `Conectado como ${viewer.name}. ${entries.length} animes sincronizados. Pode fechar esta aba e voltar ao AniMatch.`;
  } catch (error) {
    status.textContent = error.message || "Não foi possível conectar ao AniList.";
  } finally {
    loginBtn.disabled = false;
  }
}

loginBtn.addEventListener("click", connect);
syncPublicBtn.addEventListener("click", syncPublicProfile);
profileInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    syncPublicProfile();
  }
});
