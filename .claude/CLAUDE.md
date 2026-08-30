# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @rific/resizable-input

Auto-growing, drag-resizable multiline text input for React Native. Swap in `react-native-paper`'s `TextInput` (or any other input component) via `TextInputComponent`, with its props fully inferred and forwarded.

Part of the `@rific` package ecosystem. Published at https://www.npmjs.com/package/@rific/resizable-input.

## Commands

```bash
npm run lint       # ESLint check
npm run fix        # ESLint --fix
npm run build      # tsup, outputs CJS + ESM + types to dist/
npm run build:watch # tsup --watch
npm test           # Jest (28 tests)
npm run test:watch # Jest in watch mode
npm run typecheck  # tsc --noEmit
npm run verify     # lint + test + typecheck + build, in that order
```

Always run `npm run lint` before finishing any task.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm run release:patch   # npm version patch && git push --follow-tags (or release:minor / release:major)
```

`preversion` runs `npm run verify` first. The `publish.yml` workflow fires on `v*` tags and delegates to the shared reusable workflow (`infinitetoken/Workflows/.github/workflows/npm-publish.yml@v1`) with `id-token: write` permission for OIDC trusted publishing.

## Architecture

```
src/
  index.ts                          - all public exports
  ResizableInput.tsx                 - the component: auto-grow + drag-resize text input, generic over TextInputComponent
  ResizableInputConfig.tsx           - module-level config (configureResizableInput/getResizableInputConfig) + thin ResizableInputProvider wrapper
  __mocks__/
    react-native.ts                  - jest mock: real <div>/<textarea> DOM nodes for View/TextInput so onLayout and onContentSizeChange are reachable from tests; Text/Pressable/TouchableOpacity + StyleSheet/Platform stubs
    react-native-gesture-handler.ts  - jest mock: GestureHandlerRootView passthrough; GestureDetector stashes its `gesture` object on the child DOM node via a cloned ref so tests can reach it; Gesture.Pan() builds a chainable onBegin/onUpdate/onEnd object that doubles as the direct invoker a test calls to fire those callbacks synchronously
    react-native-reanimated.ts       - jest mock: useSharedValue/useAnimatedStyle/runOnJS/withTiming/withSpring/interpolate/Extrapolation stubs
  __tests__/
    ResizableInput.test.tsx
    ResizableInputConfig.test.tsx
```

### Sizing behavior

- **Baseline height.** If `minHeight` is passed, that's the floor. Otherwise the component measures its own natural single-line height on first layout (`handleLayout` → `naturalMinHeight`) and uses that. `resolvedMaxHeight` defaults to `Infinity` when `maxHeight` is omitted.
- **Auto-grow** (`autoGrow`, default `true`) is driven by the input's `onContentSizeChange`. `handleContentResize` infers the wrapper's own padding from the gap between current height and reported content height the first time it fires, then reuses that inferred padding to compute each next height, clamped to `[resolvedMinHeight, resolvedMaxHeight]`. When no explicit `initialHeight`/`minHeight` was given (`usesNaturalBaseline`) and the computed height lands within `AUTO_GROW_DELTA` (2px) of the natural baseline, height resets to `null` so the wrapper falls back to natural sizing instead of pinning a redundant explicit height.
- **Manual resize** (`resizable`, default `true`) is a `Gesture.Pan()` on the handle. `onUpdate` skips updates under a 1px delta, clamps the candidate height to the same `[resolvedMinHeight, resolvedMaxHeight]` bounds, and calls `updateHeight` via `runOnJS`.
- **`TextInputComponent` resolution order:** per-instance prop → `configureResizableInput()` global default → React Native's own `TextInput`.

## Public API

From `src/index.ts`:

- `ResizableInput`, `ResizableInputProps` (type) — the component
- `configureResizableInput` — one-time global config setter (`{ TextInputComponent? }`); not reactive, call before first render
- `getResizableInputConfig` — reads the current module-level config
- `ResizableInputConfig` (type) — config shape
- `ResizableInputProvider`, `ResizableInputProviderProps` (type) — thin wrapper that calls `configureResizableInput()` synchronously during render

## Peer Dependencies

- `react` >=19.0.0
- `react-native` >=0.76.0
- `react-native-gesture-handler` >=2.0.0 <3.0.0
- `react-native-reanimated` >=4.0.0
- `react-native-worklets` 0.10.x

## Testing

- Framework: Jest (`@infinitetoken/jest-config/react-native`), jsdom environment
- Mocks in `src/__mocks__/` for `react-native`, `react-native-gesture-handler`, `react-native-reanimated`
- 14 tests across 2 suites: `ResizableInput.test.tsx`, `ResizableInputConfig.test.tsx`
- `coverageThreshold` is not overridden in `jest.config.cjs` — coverage is 100/100/100/100 across both `ResizableInput.tsx` and `ResizableInputConfig.tsx`, comfortably clearing the fleet default (70/70/70/70).

## Code Style

Enforced by ESLint + Prettier — run `npm run lint` before finishing any task. `eslint.config.cjs` is a bare `module.exports = require('@infinitetoken/eslint-config/react-native')`, no local overrides.

**Prettier config:**
- Single quotes, JSX single quotes
- No semicolons
- No trailing commas
- Print width: 1000 (effectively disabled)

**ESLint rules (warnings unless noted):**
- `simple-import-sort` — imports and exports must be sorted
- `react-native/no-inline-styles` — no inline style objects
- `react-native/no-unused-styles` — no unused StyleSheet entries
- `no-console` — no console statements
- `@typescript-eslint/no-unused-vars` — `varsIgnorePattern`/`argsIgnorePattern`/`caughtErrorsIgnorePattern: '^_'` (unused vars/args/caught-errors prefixed `_` are allowed)
- `react-hooks/rules-of-hooks` — error, not a warning
- `react-hooks/exhaustive-deps`, `react-hooks/refs`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`, `react-hooks/set-state-in-effect`
- `package-json/order-properties`, `package-json/sort-collections` — on `package.json` itself
- `@typescript-eslint/no-explicit-any` — off in `__tests__/`/`__mocks__/` files. Still active in `ResizableInput.tsx` and `ResizableInputConfig.tsx` themselves, where a file-level `/* eslint-disable @typescript-eslint/no-explicit-any */` is load-bearing (both use `any` to stay generic over an arbitrary `TextInputComponent`).
