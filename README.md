<div align="center">
  <img src="assets/icons/logo.png" alt="Logo AniMatch" width="150">
  <h1>AniMatch</h1>
  <p>Encontre seu próximo anime de acordo com seus gostos, seu tempo e sua vibe.</p>
</div>

<p align="center">
  Uma extensão de navegador que transforma a descoberta de animes em uma experiência simples e personalizada, com dados da comunidade AniList.
</p>

## O que você pode fazer

- **Encontrar animes parecidos** com um título que você curtiu.
- **Explorar por duração**, de séries curtas a maratonas.
- **Filtrar por gênero** e descobrir novas vibes.
- **Passar, marcar como visto ou salvar** recomendações em uma fila inspirada em apps de descoberta.
- **Sincronizar uma lista pública do AniList** para pular animes que já estão nela.
- **Alternar entre português e inglês** e escolher o tema claro ou escuro.

## Instalação no Chrome

1. Baixe este repositório pelo botão **Code → Download ZIP** ou clone-o:

   ```bash
   git clone https://github.com/lucasnpiana/animatch-anilist.git
   ```

2. Abra `chrome://extensions` no Chrome.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta do AniMatch.

## Sincronizar seu AniList

Abra a tela de perfil da extensão e informe seu nome de usuário ou o link do perfil. A sincronização pública funciona quando a lista de animes está visível publicamente. Os títulos sincronizados são ignorados nas recomendações.

Para acessar uma lista privada ou salvar títulos diretamente na sua conta, use a opção de conexão OAuth. Ela requer um aplicativo registrado nas configurações de desenvolvedor do AniList e seu Client ID.

## Tecnologias

- HTML, CSS e JavaScript
- Chrome Extension Manifest V3
- API GraphQL do AniList

## Dados e privacidade

O AniMatch consulta o catálogo e as recomendações pela API do AniList. Preferências como idioma, tema e ações da fila são armazenadas no navegador. A sincronização de um perfil público consulta os dados públicos informados pelo usuário.

## Desenvolvido por

Lucas Piana · [GitHub](https://github.com/lucasnpiana)
