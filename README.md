# Moorhen WebComponent in React

A small React application that renders the Moorhen web component and drives it from React state.
The element itself is framework-agnostic. What this example shows is the React pattern around it,
using the `<Moorhen>` component and hooks from `moorhen/web-component/react`, plus a small plugin.

```tsx
<Moorhen id="my-moorhen" width={width} height={height} viewOnly={viewOnly} onReady={setInstance}>
    <ExamplePlugin />
</Moorhen>
```

## What the demo shows

`src/App.tsx` covers the pieces a React host needs:

| Step | Where |
| --- | --- |
| Render Moorhen | `<Moorhen>`, with typed props (`width`, `height`, `viewOnly`…) |
| Get the instance | `onReady={setInstance}` |
| Read the store as React state | `useMoorhenSelector("my-moorhen", selector)` |
| Use a Moorhen UI component outside Moorhen | `<MoorhenMoleculeSelect moorhen="my-moorhen" />` |
| Push React state into the instance | call instance methods from a `useEffect` |
| Follow the page theme | `setBackgroundColor()` from a `useEffect` |
| Register Moorhen callbacks | `newAtomHoveredCallback()`, `newMoleculeChangedCallback()`, `files.newFilesLoadedCallback()`, each unsubscribed on cleanup |

The page exposes width and height inputs, an RGB background colour picker, a "view only" toggle, a
molecule picker to centre the view, and
a live panel fed by Moorhen: the number of opened molecules (from the store), the hovered atom, the
last file loaded with its `origin` label, and the last molecule change. Switching the dark/light
theme resets the viewport background to match; the colour inputs follow, and you can override them
by hand afterwards.

The molecule-change callback reports edits made in the viewer (mutate, refine, delete…) and also some
internal steps during loading, where it arrives without an `action` and before the molecule is
listed. Use the files-loaded callback as the "a file arrived" signal.

## Requirements

Moorhen's Coot/CCP4 code is compiled with WebAssembly threads, which need `SharedArrayBuffer`.
Browsers only expose that to **cross-origin isolated** pages, so the server must send both headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`vite.config.ts` already sets them for the dev server. Keep them if you copy this setup: without
them the component never starts. You can check the result in the browser console with
`window.crossOriginIsolated`, which must be `true`.

## Getting started

```bash
npm install --legacy-peer-deps
cp -r node_modules/moorhen/public/MoorhenAssets public/
npm run dev
```

The copy is not optional. At runtime the element loads `moorhen.css` and the WebAssembly binaries
from `/MoorhenAssets/...`, and `public/MoorhenAssets` is git-ignored. **Repeat the copy after every
Moorhen update**, because the wasm binaries can change in any version. `npm run rebuild` does a
clean install (with `--legacy-peer-deps`) plus the copy in one step.

## How it fits together

1. `src/main.tsx` calls `registerMoorhenWebComponent()` before rendering, so the custom element and
   Moorhen's UI elements are defined for the whole app.
2. `src/App.tsx` renders `<Moorhen>` and keeps the instance it gets from `onReady` in state.
3. Outside Moorhen, the hooks and components find it by `id`, so the `id` they are given and the `id`
   on `<Moorhen>` must match. Inside Moorhen (the plugin), they find it from a ref, without an id.

```tsx
const [instance, setInstance] = useState<MoorhenInstance | null>(null);
const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);
```

The instance is an external, non-React object, which is why the demo syncs React state into it from
`useEffect`.

Note the import path: the component and hooks come from `moorhen/web-component/react`, not from
`moorhen/react-lib`. The `react-lib` entry point is a different integration path, where you compose
Moorhen's own React components directly instead of using the element.

## Example plugin

[`src/plugin/`](src/plugin) is a small Moorhen plugin. The app only renders it inside `<Moorhen>`.

- [`index.tsx`](src/plugin/index.tsx) adds a *Plugin* entry to Moorhen's menu and a modal whose content is the
  plugin's own HTML, given to Moorhen through a slot (`instance.uiExtensions`). The tools are only loaded
  (`React.lazy`) when the modal is first opened (`onOpen`).
- [`tools.tsx`](src/plugin/tools.tsx) builds the tools from Moorhen's UI components (`MoorhenButton`,
  `MoorhenToggle`, `MoorhenSlider`, `MoorhenMoleculeSelect`, `MoorhenChainSelect`…). It finds Moorhen and
  follows its state with `useMoorhenInstance` and `useMoorhenSelector`, and uses the components'
  `onChange` / `onInput`.

## React versions

The host app deliberately runs React 18.3 while the React bundled inside Moorhen is 19.x (both
versions are shown on the page), to show that the host does not need a recent React. The two
coexist: the element renders in its own shadow root and does not share React with your application.
The `moorhen/web-component/react` components set properties and listen to events through a ref, so
they work the same with React 18 and 19.

Moorhen's beta package declares a React 19 peer dependency, so install with `--legacy-peer-deps`.

## Project layout

```
index.html          Vite entry page
src/main.tsx        registers the custom element, then mounts the app
src/App.tsx         <Moorhen>, the hooks, the callbacks and the state-to-instance effects
src/plugin/         the example plugin (menu entry, modal, tools)
src/useTheme.ts     light/dark state for the page, used by the toggle in App.tsx
src/App.css         design tokens copied from the Moorhen docs site
vite.config.ts      dev server, including the cross-origin isolation headers
```

## Documentation

- [Developer guide](https://moorhen.hosted.york.ac.uk/docs/guides/developer/index.html)
  - [Using the WebComponent in React](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-react.html):
    this example, step by step
  - [The Moorhen WebComponent](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-intro.html):
    how it works and how the `moorhen` package is organised
  - [Loading data and the MoorhenInstance API](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-instance-api.html)
  - [Callbacks and subscriptions](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-events.html)
- [API reference](https://moorhen.hosted.york.ac.uk/docs/api/index.html)
- Plain TypeScript version of this example:
  [MoorhenWebComponent](https://github.com/cdegut/MoorhenWebComponent)
