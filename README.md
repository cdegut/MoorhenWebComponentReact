# Moorhen WebComponent in React

A small React application that renders the Moorhen web component and drives it from React state.
The element itself is framework-agnostic. What this example shows is the React pattern around it,
using the two helper hooks that ship with the `moorhen` package.

```tsx
<moorhen-web-component id="my-moorhen" width={width} height={height} view-only={viewOnly} />
```

## What the demo shows

`src/App.tsx` covers the pieces a React host needs:

| Step | Where |
| --- | --- |
| Teach TypeScript about the tag | `declare module "react"` → `JSX.IntrinsicElements` |
| Get the instance | `useWebComponentInstanceRef("my-moorhen")` |
| Read the store as React state | `useMoorhenSelector("my-moorhen", selector)` |
| Push React state into the element | assign to `moorhenInstanceRef.current` in a `useEffect` |
| Follow the page theme | `setBackgroundColor()` from a `useEffect` |
| Register Moorhen callbacks | `newAtomHoveredCallback()`, `newMoleculeChangedCallback()`, `files.newFilesLoadedCallback()`, each unsubscribed on cleanup |

The page exposes width and height inputs, an RGB background colour picker, a "view only" toggle, and
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
npm install
cp -r node_modules/moorhen/public/MoorhenAssets public/
npm run dev
```

The copy is not optional. At runtime the element loads `moorhen.css` and the WebAssembly binaries
from `/MoorhenAssets/...`, and `public/MoorhenAssets` is git-ignored. **Repeat the copy after every
Moorhen update**, because the wasm binaries can change in any version. `npm run rebuild` does a
clean install (with `--legacy-peer-deps`) plus the copy in one step.

## How it fits together

1. `src/main.tsx` calls `registerMoorhenWebComponent()` before rendering, so the custom element is
   defined for the whole app.
2. `src/App.tsx` declares the tag for JSX, then renders it.
3. Both hooks find the element by `id`, so the `id` passed to the hooks and the `id` on the element
   must match.

```tsx
const [isReady, moorhenInstanceRef] = useWebComponentInstanceRef("my-moorhen");
const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);
```

The element and its instance are external, non-React objects, which is why the demo syncs React
state into them from `useEffect`. Assigning to the ref during render is not safe.

Note the import path: the hooks come from `moorhen/web-component/utils`, not from
`moorhen/react-lib`. The `react-lib` entry point is a different integration path, where you compose
Moorhen's own React components directly instead of using the element.

## React versions

The host app runs React 18 while the React bundled inside Moorhen is 19.x (both versions are shown
on the page). The two coexist: the element renders in its own shadow root and does not share React
with your application.

## Project layout

```
index.html          Vite entry page
src/main.tsx        registers the custom element, then mounts the app
src/App.tsx         JSX typing, the two hooks, and the state-to-element effects
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
