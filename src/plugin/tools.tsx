/**
 * The example plugin's tools, built from Moorhen's UI components. Loaded when the plugin is first opened.
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
            <MoorhenToggle checked={drawAxes ?? false} onChange={checked => instance?.sceneSettings.setDrawAxes(checked)}>
                Draw axes
            </MoorhenToggle>
            {/* onInput: the view zooms while the slider is dragged, not only when it is released */}
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
