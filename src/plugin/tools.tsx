/**
 * The example plugin's tools, built from Moorhen's UI components. Loaded when the plugin is first opened.
 *
 * React 18 and React 19
 * ---------------------
 * The components used here (MoorhenToggle, MoorhenSlider…) come from `moorhen/web-component/react`. They are
 * thin wrappers around Moorhen's custom elements (<moorhen-toggle>, <moorhen-slider>…): they set the
 * element's properties and add its event listeners themselves, through a ref. So this file runs unchanged
 * on React 18 (this app) and React 19.
 *
 * The wrappers are needed in React 18 because React 18 only knows attributes on custom elements: it
 * passes `checked={true}` as an attribute (only the starting state), and it does not attach `onChange` /
 * `onInput` to a custom element's own `change` / `input` events. Without the wrappers, React 18 has to
 * listen through a ref:
 *
 *     const axesRef = useRef<MoorhenToggleElement>(null);
 *     useMoorhenEvent(axesRef, "change", toggle => instance?.sceneSettings.setDrawAxes(toggle.checked));
 *     return <moorhen-toggle ref={axesRef} checked={drawAxes}>Draw axes</moorhen-toggle>;
 *
 * React 19 supports custom elements: it sets properties (so `checked` and `value` follow React state)
 * and `onChange` / `onInput` listen to the element's events. There, the elements can be used directly,
 * once declared for JSX (the `…ElementAttributes` types come from `moorhen/web-component`):
 *
 *     declare module "react" {
 *         namespace JSX {
 *             interface IntrinsicElements {
 *                 "moorhen-toggle": MoorhenToggleElementAttributes;
 *                 "moorhen-slider": MoorhenSliderElementAttributes;
 *             }
 *         }
 *     }
 *
 * The handlers then receive the DOM event, not the value: read it from `e.currentTarget`. See the React 19
 * versions next to the toggle and the slider below. The wrappers still work in React 19, and are typed
 * without the declaration above, so they remain the simplest choice in both versions.
 */
import { useRef } from "react";
import type { MoorhenChainSelectElement, MoorhenMoleculeSelectElement } from "moorhen/web-component";
import {
    MoorhenButton,
    MoorhenChainSelect,
    MoorhenInfoCard,
    MoorhenMoleculeSelect,
    MoorhenSlider,
    MoorhenToggle,
    useMoorhenInstance,
    useMoorhenSelector,
} from "moorhen/web-component/react";

export default function PluginTools() {
    const ref = useRef<HTMLDivElement>(null);
    const instance = useMoorhenInstance(ref);

    // Moorhen's state: the controls show it, also when it is changed elsewhere in Moorhen
    const drawAxes = useMoorhenSelector(ref, state => state.sceneSettings.drawAxes);
    const zoom = useMoorhenSelector(ref, state => state.sceneSettings.zoom);

    // The selection is read from the elements when needed (also the selects' own first picks, which
    // fire no onChange). onChange={value => …} is there to react as the user changes it.
    const moleculeRef = useRef<MoorhenMoleculeSelectElement>(null);
    const chainsRef = useRef<MoorhenChainSelectElement>(null);
    const report = () => {
        const molecules: { uniqueId: string; name: string }[] = instance?.store.getState().molecules.moleculeList ?? [];
        const molecule = molecules.find(m => m.uniqueId === moleculeRef.current?.value);
        instance?.snackbar.enqueueSnackbar({
            message: molecule ? `${molecule.name}: chains ${chainsRef.current?.values.join(", ")}` : "Load a structure first",
            variant: "info",
        });
    };

    return (
        <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem" }}>
            <MoorhenInfoCard info="An example plugin: these tools are the page's own HTML, shown in a Moorhen modal." />
            <MoorhenButton
                icon="MatSymAdd"
                label="Load the tutorial structure"
                onClick={() =>
                    instance?.files.loadFiles({ url: "/MoorhenAssets/tutorials/moorhen-tutorial-structure-number-1.ent", filename: "tutorial-1.ent" })
                }
            />
            {/* React 19 only, with the element itself:
                <moorhen-toggle
                    checked={drawAxes ?? false}
                    onChange={e => instance?.sceneSettings.setDrawAxes(e.currentTarget.checked)}
                >
                    Draw axes
                </moorhen-toggle> */}
            <MoorhenToggle checked={drawAxes ?? false} onChange={checked => instance?.sceneSettings.setDrawAxes(checked)}>
                Draw axes
            </MoorhenToggle>
            {/* onInput: the view zooms while the slider is dragged, not only when it is released.
                React 19 only, with the element itself (attributes are written in kebab-case):
                <moorhen-slider
                    label="Zoom" min={0.05} max={5} scale="log" decimal-places={2}
                    value={zoom ?? 1}
                    onInput={e => instance?.sceneSettings.setZoom(e.currentTarget.value)}
                /> */}
            <MoorhenSlider
                label="Zoom"
                min={0.05}
                max={5}
                scale="log"
                decimalPlaces={2}
                value={zoom ?? 1}
                onInput={value => instance?.sceneSettings.setZoom(value)}
            />
            <MoorhenMoleculeSelect ref={moleculeRef} id="example-plugin-molecule" label="Molecule" />
            {/* `for`: the chains follow the molecule select, also its own first pick */}
            <MoorhenChainSelect ref={chainsRef} for="example-plugin-molecule" multiple label="Chains" />
            <MoorhenButton label="Report selection" variant="secondary" onClick={report} />
        </div>
    );
}
