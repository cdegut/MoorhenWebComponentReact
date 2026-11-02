# Writing a Moorhen plugin

This page explains how to add your own tools to a page that embeds
`<moorhen-web-component>`, as a self-contained package the host page uses in one line:

```tsx
import { SaxsPlugin } from "moorhen-squab/react";

<moorhen-web-component id="my-moorhen" width={width} height={height}>
    <SaxsPlugin />
</moorhen-web-component>
```

The worked example throughout is **MoorhenSquab** (Toby King's SAXS calculator), whose
plugin lives in [`MoorhenSquab/npm/`](../MoorhenSquab/npm). It covers everything below: a
side panel or modal, menu entries, reading molecules from Moorhen, a long calculation in
a Web Worker with progress and Cancel, and packaging. When in doubt, copy from there.

The APIs described here were checked against **Moorhen 1.0.2**, the first release with
`instance.uiExtensions`.

---

## 1. The shape of a plugin

A plugin is a React component that you place **inside** the web component. It:

1. finds the enclosing `<moorhen-web-component>` and waits for its Moorhen instance;
2. renders its own UI as **light-DOM content with a `slot` attribute**;
3. registers a Moorhen **side panel** or **modal** that shows that slot;
4. optionally adds **menu entries** that open it;
5. reads data from Moorhen (molecules, maps) and does its work, off the main thread if
   the work is heavy.

```
<moorhen-web-component>                 ← Moorhen renders into its shadow root
  #shadow-root
    … Moorhen UI … <slot name="saxs">  ← drawn by Moorhen inside its panel frame
  <div slot="saxs">…</div>             ← your plugin, rendered by the host page's React
</moorhen-web-component>
```

### Why slots

Moorhen bundles its own React (19.x); the host page may run a different one (this
example runs 18.3). React elements cannot cross between two Reacts, so inside the web
component Moorhen only accepts **slot** extensions. `uiExtensions.addModal` and
`addSidePanel` throw for anything else. Your UI is rendered by the host's React and only
*projected* into Moorhen's frame.

Two useful consequences:

- the UI stays mounted while the panel is closed, so its state (results, form inputs)
  survives closing, reopening and moving between side panel and modal;
- it is styled by the host page, not by `moorhen.css` (see [§6](#6-styling)).

For the same reason, never give Moorhen's menu system JSX from the host: avoid the
`customJSX` and `popover` menu-item types and the `jsx` main-menu type.

---

## 2. Getting the Moorhen instance

From inside the element, walk up to it and ask for the instance:

```ts
import type { MoorhenInstance } from "moorhen/web-component";

useEffect(() => {
    const host = rootRef.current?.closest("moorhen-web-component") as
        (HTMLElement & { getMoorhenInstance(): Promise<MoorhenInstance> }) | null;
    if (!host) return;
    let cancelled = false;
    customElements
        .whenDefined("moorhen-web-component")          // element may not be upgraded yet
        .then(() => host.getMoorhenInstance())
        .then((instance) => instance.execWhenReady(() => instance)) // Coot initialised
        .then((instance) => { if (!cancelled) setInstance(instance); });
    return () => { cancelled = true; };
}, []);
```

`SaxsPlugin.tsx` does exactly this, and also accepts an `instance` prop for hosts that
already hold one (for example a React-library build of Moorhen).

---

## 3. A side panel or a modal

```ts
// Side panel: a tab beside Models / Maps / Scene settings…
const remove = instance.uiExtensions.addSidePanel({
    id: "saxs",               // panel id
    label: "SAXS",            // tab label
    icon: "MatSymExperiment", // a MoorhenSVG name
    slotName: "saxs",         // matches <div slot="saxs">
    title: "SAXS (MoorhenSquab)",
});

// …or a draggable modal
const remove = instance.uiExtensions.addModal({
    id: "saxs",
    title: "SAXS (MoorhenSquab)",
    slotName: "saxs",
    allowDocking: true,
    initialWidth: 760, initialHeight: 700, minWidth: 460, minHeight: 360,
});
```

Both return a function that removes the extension, so they fit a `useEffect` directly.
Both also accept `onOpen` / `onClose` callbacks. An `id` equal to a built-in one replaces
the built-in.

Usable icons are the `MatSym…` names in Moorhen's icon set, for example `MatSymExperiment`,
`MatSymCalculate`, `MatSymInfo`, `MatSymTune` and `MatSymFactCheck`.

### Opening and closing from code

The action creators are not exported from `moorhen/web-component`, so dispatch the
action types directly:

```ts
instance.dispatch({ type: "globalUI/setShownSidePanel", payload: "saxs" }); // open the side panel
instance.dispatch({ type: "globalUI/setShownSidePanel", payload: null });   // close it
instance.dispatch({ type: "modals/showModal", payload: { key: "saxs" } });  // open the modal
instance.dispatch({ type: "modals/hideModal", payload: "saxs" });           // close it
```

The SAXS plugin can switch between the two at run time: it removes one registration,
adds the other and reopens it (`togglePlacement` in `useSaxsPlugin.ts`).

---

## 4. Menu entries

`instance.menuSystem` exposes:

```ts
// A main-menu button (the column of icons). Types: "action" | "modal" | "panel" | "sub-menu"
menuSystem.addMainMenu({
    type: "action",
    label: "SAXS",
    ariaLabel: "Open SAXS (MoorhenSquab)",
    icon: "MatSymExperiment",
    action: () => open(),
});

// Items in an existing sub-menu ("file", "edit", "calculate", "validation", "view", "ligand", …)
menuSystem.addToExistingSubmenu(
    [{ type: "item", id: "open-saxs", label: "SAXS curves…", onClick: () => open() }],
    "calculate"
);

// A whole new sub-menu (pair it with a main-menu entry of type "sub-menu", menu: "<key>")
menuSystem.addSubmenu({ saxs: { label: "SAXS", items: [/* … */] } });
```

Menu item types usable from a slot plugin are `item` (`onClick`), `showModal`
(`modal: id`), `showPanel` (`panel: id`), `dispatch`, `separator` and
`preferenceSwitch`.

There is **no API to remove a main-menu entry**, and `mainMenuMap` is shared by every
Moorhen instance on the page. So add entries **once**, guarded:

```ts
if (!Object.values(menuSystem.mainMenuMap).some((e) => e.ariaLabel === "Open SAXS (MoorhenSquab)")) {
    menuSystem.addMainMenu({ /* … */ });
}
```

This guard also absorbs React StrictMode's double-run effects. Because the entries stay,
have them call your code through a ref (`openRef.current()`), so they always see current
state.

---

## 5. Reading data from Moorhen

### Molecules

Use **`instance.getMoleculeList()`**. Do not read `state.molecules.moleculeList`
directly; that is deprecated. `getMoleculeList()` returns the same array until a
molecule is added or removed, so it works as a `useSyncExternalStore` snapshot, re-reading
on store changes without re-rendering on unrelated ones (hover etc.):

```ts
const molecules = useSyncExternalStore(
    instance.store.subscribe,
    () => instance.getMoleculeList(),
    () => instance.getMoleculeList(), // server rendering
);
```

Each `MoorhenMolecule` has `name`, `uniqueId`, `molNo` and `gemmiStructure`. To get
coordinates out:

```ts
const mmcif = await molecule.getAtoms("mmcif"); // molecules_container_t, via the Coot worker
// or, from Moorhen's gemmi structure:
const mmcif2 = window.gemmiModule.get_mmcif_string_from_gemmi_struct(molecule.gemmiStructure);
```

`"pdb"` is also accepted by `getAtoms`. The SAXS plugin uses `getAtoms("mmcif")` and
falls back to the gemmi route.

### Changes and events

- `instance.newMoleculeChangedCallback((uid, action, cid) => …)`: edits (mutate, refine,
  delete…). It also fires during loading without an `action`.
- `instance.files.newFilesLoadedCallback((files, origin) => …)`: a file arrived.
- `instance.newAtomHoveredCallback(…)`: hover.

Each returns its unsubscribe function. `App.tsx` in this repo shows all three.

---

## 6. Styling

Slotted content lives in the host page, so `moorhen.css` does not reach it, and the
page's CSS does. Two consequences:

- **Ship your own styles with the component.** `SaxsPlugin` renders a `<style>` element
  with the rules from `src/react/styles.ts`, so the host imports nothing.
- **Scope everything** under a class of your own (`.saxs-panel …`), because those rules
  apply to the whole page.

Moorhen's theme variables are inherited through the slot, so you can follow its light
and dark themes. Give each one a fallback:

```css
.my-panel button {
    background: var(--moorhen-button-background, #2c3e50);
    color: var(--moorhen-button-text, #fff);
}
```

Available: `--moorhen-background`, `--moorhen-background-shaded`, `--moorhen-border`,
`--moorhen-button-background`, `--moorhen-button-background-secondary`,
`--moorhen-button-text`, `--moorhen-input-background`, `--moorhen-primary`,
`--moorhen-secondary`, `--moorhen-accent`, `--moorhen-error`, `--moorhen-danger`,
`--moorhen-warning` and `--moorhen-font-family`.

Side panels are narrow (450 px by default). `SaxsPanel` sets `data-placement` so the CSS
can tighten the layout there.

---

## 7. Long calculations: keep Moorhen responsive

Anything that takes more than a few hundred milliseconds must not run on the main thread.
Moorhen and the host page share it, so the viewer freezes until it finishes.

MoorhenSquab's C++ (WebAssembly) runs in a **Web Worker**:

- `src/worker/squabWorker.ts` is the worker entry. It handles `prepare`,
  `calculateCurve`, `fitToProfile`… messages, posts `progress`, and supports `abort`.
- `src/SquabWorkerCalculator.ts` is the page-side client: the same calls returning
  promises, plus `onBusyChange`, `AbortSignal` support, `cancel()` (restarts the worker)
  and `terminate()`.
- `scripts/build-worker.mjs` inlines the worker, the calculator, the data tables and the
  Emscripten module into **one module source string**. The client starts it from a Blob
  URL. Hosts need **no bundler configuration**. In contrast,
  `new Worker(new URL("./w.js", import.meta.url))` inside a dependency breaks in Vite's
  dev server unless the host excludes the package from dependency optimisation.
- `test/worker-smoke.mjs` runs the real bundle in a thread and checks results, progress,
  abort and cancel, and that the main thread keeps running during a fit.

If you compile C++ with Emscripten for a plugin:

- **`-sSINGLE_FILE=1`** embeds the `.wasm` in the JS, so nothing has to be copied into the
  host's `public/`.
- **`-sENVIRONMENT=web,worker`** lets the same module run in a worker.
- **`-sMODULARIZE -sEXPORT_ES6`** produces an importable factory.
- **Exceptions.** Enable them at compile time too (`-fexceptions`), or `try/catch` in
  your C++ won't catch. Emscripten 6 no longer exports `getExceptionMessage`, so catch
  exceptions in a thin C++ wrapper and return the message (see
  `cpp/squab_npm_bindings.cpp`).

### Reporting "busy"

- Show progress and a **Cancel** button in your own panel.
- For feedback while the panel is closed, use Moorhen's snackbar. A shared `tag` makes
  each message replace the previous one:
  ```ts
  instance.dispatch({
      type: "snackbar/enqueueSnackbar",
      payload: { message: "SAXS: fitting… 40%", variant: "info", tag: "moorhen-squab", autoHideDuration: null },
  });
  ```
  Re-enqueueing re-animates the snackbar, so update it coarsely (the SAXS plugin does it
  every 10%).
- **Do not set `globalUI.busy`.** Moorhen's command centre resets it whenever a Coot
  command starts or ends, so it would flicker off as soon as the user does anything.

---

## 8. Packaging

The layout used by MoorhenSquab (`npm/package.json`):

| Entry | Contents |
| --- | --- |
| `moorhen-squab` | Framework-free core: `SquabCalculator`, `SquabWorkerCalculator`, parsing/fitting helpers |
| `moorhen-squab/react` | The plugin: `SaxsPlugin`, plus `useSaxsPlugin`, `SaxsPanel`, `SaxsPlot` for custom layouts |

Recommendations:

- **Use plain ESM** (`"type": "module"`) with `exports` entries and `.d.ts` types.
- **Make React a peer dependency, optional** (`peerDependencies` +
  `peerDependenciesMeta`), so the core works without React and the host's React is
  used.
- **Don't depend on `moorhen`.** Describe the parts of the instance you use with
  structural types (`src/react/moorhenTypes.ts`), so the plugin works with whatever
  Moorhen the host has.
  - Moorhen declares many methods as arrow-function properties with narrow parameter
    types (e.g. `icon: MoorhenSVG`). Type yours bivariantly, as that file's `Bivariant`
    helper does, or Moorhen's real `MoorhenInstance` won't fit.
  - Check it with a one-line assignment: `const x: MoorhenInstanceLike = realInstance`.
- **Keep heavy imports out of the UI path.** The SAXS plugin imports only the worker
  client and small helpers (`src/defaults.ts`), not the main-thread WASM module, so the
  host doesn't load the 1 MB WASM twice.
- **Give the component sensible defaults and a few props.** `SaxsPlugin` takes `id`
  (panel id and slot name), `defaultPlacement`, `addMenuEntries` and `instance`.

### Building and installing locally (before publishing to npm)

```bash
# in the plugin package
npm install && npm run build && npm test && npm pack   # → my-plugin-x.y.z.tgz

# in the host
npm install ../path/to/my-plugin-x.y.z.tgz
```

Install the packed tarball, not the folder. A folder install is a symlink, which drags in
the source tree and confuses Vite's dependency pre-bundling. Bump the version whenever
you repack, because npm's lockfile records each tarball's integrity hash.

---

## 9. Minimal plugin skeleton

A complete, if small, plugin: a side panel listing the loaded molecules with a button
that fetches one as mmCIF.

```tsx
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MoorhenInstance } from "moorhen/web-component";

const ID = "hello";
const NONE: ReturnType<MoorhenInstance["getMoleculeList"]> = [];

export function HelloPlugin() {
    const rootRef = useRef<HTMLDivElement>(null);
    const [instance, setInstance] = useState<MoorhenInstance | null>(null);
    const [info, setInfo] = useState("");

    // 1. find the Moorhen instance
    useEffect(() => {
        const host = rootRef.current?.closest("moorhen-web-component") as
            (HTMLElement & { getMoorhenInstance(): Promise<MoorhenInstance> }) | null;
        if (!host) return;
        let cancelled = false;
        customElements.whenDefined("moorhen-web-component")
            .then(() => host.getMoorhenInstance())
            .then((i) => i.execWhenReady(() => i))
            .then((i) => { if (!cancelled) setInstance(i); });
        return () => { cancelled = true; };
    }, []);

    // 2. register the side panel (removed again on unmount)
    useEffect(() => {
        if (!instance) return;
        return instance.uiExtensions.addSidePanel({
            id: ID, label: "Hello", title: "Hello plugin", icon: "MatSymInfo", slotName: ID,
        });
    }, [instance]);

    // 3. one main-menu entry, added once
    useEffect(() => {
        const menus = instance?.menuSystem;
        if (!instance || !menus) return;
        if (Object.values(menus.mainMenuMap).some((e) => e.ariaLabel === "Open Hello")) return;
        menus.addMainMenu({
            type: "action", label: "Hello", ariaLabel: "Open Hello", icon: "MatSymInfo",
            action: () => instance.dispatch({ type: "globalUI/setShownSidePanel", payload: ID }),
        });
    }, [instance]);

    // 4. live molecule list
    const molecules = useSyncExternalStore(
        instance ? instance.store.subscribe : () => () => {},
        () => instance?.getMoleculeList() ?? NONE,
        () => instance?.getMoleculeList() ?? NONE,
    );

    // 5. the UI, projected into the panel
    return (
        <div ref={rootRef} slot={ID} className="hello-panel" style={{ padding: "0.75rem" }}>
            <ul>
                {molecules.map((m) => (
                    <li key={m.uniqueId}>
                        {m.name}{" "}
                        <button onClick={async () => setInfo(`${m.name}: ${(await m.getAtoms("mmcif")).length} characters of mmCIF`)}>
                            mmCIF
                        </button>
                    </li>
                ))}
            </ul>
            <p>{info}</p>
        </div>
    );
}
```

Used as `<moorhen-web-component …><HelloPlugin /></moorhen-web-component>`. From here,
compare with `MoorhenSquab/npm/src/react/` for placement switching, the snackbar, a
worker-backed calculation and packaging.

---

## 10. Checklist

- [ ] The component sits **inside** `<moorhen-web-component>` and renders a `slot="<id>"` element.
- [ ] It waits for `getMoorhenInstance()` and `execWhenReady`.
- [ ] Only slot extensions and no host JSX are handed to Moorhen.
- [ ] `addSidePanel` / `addModal` removers are returned from effects.
- [ ] Main-menu entries are added once (guarded) and call through a ref.
- [ ] Molecules are read with `getMoleculeList()`, kept current with `store.subscribe`.
- [ ] Styles are injected by the component, scoped, and use `--moorhen-*` variables with fallbacks.
- [ ] Heavy work runs in a Web Worker, with progress, Cancel and a snackbar for when the panel is closed.
- [ ] `globalUI.busy` is left alone.
- [ ] The package is ESM with types, has React as an optional peer, and has no dependency on `moorhen`.
- [ ] It works with the host's COOP/COEP headers (needed by Moorhen itself). If the host
      has a Content-Security-Policy, check `worker-src blob:` for blob workers.

## Known gaps in Moorhen's plugin API (as of 1.0.2)

- `showModal`, `hideModal` and `setShownSidePanel` are not exported from
  `moorhen/web-component`, so plugins dispatch raw action types.
- A main-menu entry cannot be removed, and `mainMenuMap` is shared between instances.
- `instance.menuSystem` is documented as internal, though it is the only way to add menus.
