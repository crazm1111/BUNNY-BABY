# Bunny Baby – Shopify theme

This repo holds the code of the **Bunny Baby Store** theme (`hbybfz-ej.myshopify.com`).
The theme is **Horizon v4.5.0** by Shopify (free theme, license in `HORIZON-LICENSE.md`).
Languages: **Arabic (default, right-to-left)** and **English**.

The repo is connected to Shopify with the **Shopify GitHub integration**:

- When code is pushed to a connected branch, Shopify updates the matching theme.
- When someone saves a change in the Shopify theme editor, Shopify commits it back to that branch.

> **Do not edit the live (published) theme directly.** All work goes through the branches below.

## Folder layout

The theme folders sit at the top of the repo, exactly as Shopify expects:
`assets/ blocks/ config/ layout/ locales/ sections/ snippets/ templates/`.
There is no build step. Don't move these folders into a sub-folder, or Shopify can't connect the branch.

## Branches

| Branch    | Connected Shopify theme (unpublished) | What it's for |
|-----------|----------------------------------------|---------------|
| `develop` | **Bunny Baby – Develop**               | All work and previews happen here |
| `main`    | **Bunny Baby – Main**                  | Approved version. This theme gets published on launch day |

## Daily workflow

1. **Always `git pull` before you start.** Shopify commits theme-editor changes to the branch
   (mostly `config/settings_data.json` and `templates/*.json`), so your copy can be out of date.
2. For code work, make a feature branch from `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/short-name
   ```
3. Preview locally with hot reload:
   ```bash
   shopify theme dev --store hbybfz-ej.myshopify.com
   ```
4. Before every pull request, run:
   ```bash
   shopify theme check
   ```
5. Open a pull request into `develop`. After it's merged, check the preview of the **Develop** theme.
6. **Release:** open a pull request from `develop` into `main`. The owner checks the **Main** theme
   preview on a phone, in Arabic and in English, before it's merged.

### Merge conflicts in settings files

If `config/settings_data.json` or a `templates/*.json` file has a merge conflict,
**the version saved from the Shopify theme editor wins**, unless the owner says otherwise.

## Rules

- Never connect a branch to the live theme.
- Never commit secrets: no tokens, `.env` files or theme passwords.
- Keep commit messages short and plain, for example `Add shop-by-stage section to homepage`.
