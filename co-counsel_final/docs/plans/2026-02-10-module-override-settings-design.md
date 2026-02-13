# Module Override Settings — Design (2026-02-10)

## Goal
Add per-module provider/model overrides in Settings to control which provider + models each swarm/station uses. Defaults should fall back to global provider settings.

## Scope
- Settings UI: a new "Module Overrides" section under the Providers tab.
- Backend: settings snapshot includes module catalog + overrides, updates persist per module.
- Supported overrides: chat model (default), embeddings + vision (behind an advanced toggle).

## UI Plan
- Location: Providers tab, below global model defaults.
- Layout: card grid of modules; each card shows module name + source badge (Core/Team).
- Controls per module:
  - Provider dropdown: "Use global default" or specific provider.
  - Chat model dropdown: "Auto" or specific model.
  - Advanced toggle reveals embeddings + vision model dropdowns.
- Fallbacks:
  - When provider override is empty, model list derives from global primary provider.
  - When provider override is set, model list derives from the selected provider.

## Data Flow
1. `SettingsPanel` reads:
   - `settings.module_catalog`
   - `settings.providers.module_overrides`
   - global provider catalog
2. UI writes `module_overrides` into `providers` update payload.
3. Backend merges overrides into stored provider settings.

## Error Handling
- Empty model lists show a disabled "No models" option.
- Blank overrides are omitted from payload (converted to `null` on update).

## Testing (Manual)
- Open Settings → Providers; expand Module Overrides.
- Confirm dropdowns populate for OpenAI/OpenRouter/HuggingFace catalogs.
- Toggle Advanced on/off and verify embeddings + vision persist.
- Save and reload; verify overrides persist.

