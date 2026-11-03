# AniMatch

Extensão de navegador para descobrir animes usando recomendações da comunidade AniList, filtros por gênero e duração e uma fila de descoberta personalizada.

## Recursos

- Recomendações relacionadas a um anime informado pelo usuário.
- Exploração por duração e gênero.
- Ações para passar, marcar como já visto ou salvar na lista local.
- Sincronização de uma lista pública do AniList para evitar recomendações repetidas.
- Login OAuth opcional para sincronizar listas privadas e salvar animes na conta.

## Instalar no Chrome

1. Baixe ou clone este repositório.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.

## Sincronizar uma lista pública

Abra o perfil dentro da extensão, informe o nome de usuário ou o link do perfil AniList e clique em **Buscar lista pública**. A lista precisa estar pública.

## API

O catálogo e as recomendações usam a API GraphQL do AniList: <https://graphql.anilist.co>.
