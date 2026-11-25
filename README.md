# Exemple of moorhen Webcomponent inside an React app

## Moorhen in a React app

[`src/App.tsx`](src/App.tsx) renders Moorhen with the `<Moorhen>` component from `moorhen/web-component/react`
(after `registerMoorhenWebComponent()`): its size follows React state through props, and `onReady` gives the
`MoorhenInstance`. The app deliberately uses React 18.3 while Moorhen runs on its own bundled React 19.2: the versions do not
need to match, and the host app does not need a recent React. (Moorhen's package declares a React 19 peer
dependency, so install with `npm install --legacy-peer-deps`.)

## Example plugin

[`src/plugin/`](src/plugin) is a small Moorhen plugin. The app only renders it inside the web component:

```tsx
<moorhen-web-component id="my-moorhen">
    <ExamplePlugin />
</moorhen-web-component>
```

- [`index.tsx`](src/plugin/index.tsx) adds a *Plugin* entry to Moorhen's menu and a modal whose content is the
  plugin's own HTML, given to Moorhen through a slot (`instance.uiExtensions`). The tools are only loaded
  (`React.lazy`) when the modal is first opened (`onOpen`).
- [`tools.tsx`](src/plugin/tools.tsx) builds the tools from Moorhen's UI elements (`<moorhen-button>`,
  `<moorhen-toggle>`, `<moorhen-slider>`, `<moorhen-molecule-select>`, `<moorhen-chain-select>`…). It finds
  Moorhen and follows its state with `useMoorhenInstance` and `useMoorhenSelector` from
  `moorhen/web-component/react`, and uses the components' `onChange` / `onInput`. These wrappers set properties
  and listen to events through a ref, so they work the same with React 18 and 19.

See the developer guide's *Writing a plugin* page for the details.
