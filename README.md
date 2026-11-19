# Bunny Baby – Shopify theme

This repo holds the code of the **Bunny Baby Store** theme (`hbybfz-ej.myshopify.com`).
The theme is **Horizon v4.5.0** by Shopify (free theme, license in `HORIZON-LICENSE.md`).
Languages: **Arabic (default, right-to-left)** and **English**.

The repo is connected to Shopify with the **Shopify GitHub integration**:

- When code is pushed to `main`, Shopify updates the connected theme.
- When someone saves a change in the Shopify theme editor, Shopify commits it back to `main`.

> **Do not edit the live (published) theme directly.** All work goes through `main` and its connected, unpublished theme.

## Folder layout

The theme folders sit at the top of the repo, exactly as Shopify expects:
`assets/ blocks/ config/ layout/ locales/ sections/ snippets/ templates/`.
There is no build step. Don't move these folders into a sub-folder, or Shopify can't connect the branch.

## Branch

There is **one branch: `main`**. It is connected to an **unpublished** Shopify theme
(for example "Bunny Baby – Main"). On launch day, that theme gets published.

## Daily workflow

1. **Always `git pull` before you start.** Shopify commits theme-editor changes to `main`
   (mostly `config/settings_data.json` and `templates/*.json`), so your copy can be out of date.
2. Preview code changes locally with hot reload before pushing:
   ```bash
   shopify theme dev --store hbybfz-ej.myshopify.com
   ```
3. Before every push, run:
   ```bash
   shopify theme check
   ```
4. Push to `main`. Shopify updates the connected theme within a minute or so.
   Then check its preview on a phone, in Arabic and in English.

### Merge conflicts in settings files

If `config/settings_data.json` or a `templates/*.json` file has a merge conflict,
**the version saved from the Shopify theme editor wins**, unless the owner says otherwise.

## Rules

- Never connect `main` to the theme that is live right now.
- Never commit secrets: no tokens, `.env` files or theme passwords.
- Keep commit messages short and plain, for example `Add shop-by-stage section to homepage`.
