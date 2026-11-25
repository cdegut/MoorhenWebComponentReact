import { useEffect, useState } from "react";
import React from "react";
import type { MoorhenInstance } from "moorhen/web-component";
import { Moorhen, MoorhenMoleculeSelect, useMoorhenSelector } from "moorhen/web-component/react";
import "./App.css";
import { ExamplePlugin } from "./plugin";
import { useTheme, type Theme } from "./useTheme";

const themeBackground = (theme: Theme): [number, number, number] =>
    theme === "dark" ? [27 / 255, 30 / 255, 34 / 255] : [1, 1, 1];

// registerMoorhenWebComponent() is called in main.tsx, before the app renders: it defines
// <moorhen-web-component> and Moorhen's UI elements, used by <Moorhen> and the plugin.

function App() {
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(768);
    const [viewOnly, setViewOnly] = useState(false);
    const [theme, toggleTheme] = useTheme();
    const [backgroundColor, setBackgroundColor] = useState(() => themeBackground(theme));

    // The instance, once Moorhen is ready (onReady below), and a value of its state
    const [instance, setInstance] = useState<MoorhenInstance | null>(null);
    const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);

    const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
    const [lastLoad, setLastLoad] = useState<string | null>(null);
    const [lastMoleculeChange, setLastMoleculeChange] = useState<string | null>(null);

    useEffect(() => {
        instance?.sceneSettings.setBackgroundColor([...backgroundColor, 1]);
    }, [instance, backgroundColor]);

    // Tie the 3D viewport to the page theme: switching theme resets the
    // background to match, and the colour inputs stay in sync. Pick a
    // colour by hand afterwards if you want to override it.
    const switchTheme = () => {
        setBackgroundColor(themeBackground(theme === "dark" ? "light" : "dark"));
        toggleTheme();
    };

    // Moorhen callbacks are plain subscriptions: register them once the instance
    // exists, and return the unsubscribe functions they hand back.
    useEffect(() => {
        if (!instance) {
            return;
        }

        // The callback can fire before the molecule is listed, so the name may not
        // resolve yet: fall back to a short id.
        const label = (moleculeId: string) =>
            instance.getMolecule(moleculeId)?.name ?? `molecule ${moleculeId.slice(0, 8)}`;

        const stopHover = instance.newAtomHoveredCallback((moleculeId, residueNumber, atomName) => {
            setHoveredAtom(`${atomName} in residue ${residueNumber} of ${label(moleculeId)}`);
        });

        const stopChanges = instance.newMoleculeChangedCallback((moleculeId, action) => {
            setLastMoleculeChange(`${label(moleculeId)}: ${action ?? "changed"}`);
        });

        const stopFiles = instance.files.newFilesLoadedCallback((files, origin) => {
            const names = files.map((file) => file.fileName).join(", ");
            setLastLoad(`${names} (from "${origin}")`);
        });

        return () => {
            stopHover();
            stopChanges();
            stopFiles();
        };
    }, [instance]);

    const loadExampleStructure = () => {
        // The second argument is an optional label; the files-loaded callback
        // receives it back as `origin`, which is handy when several parts of
        // your app load files.
        instance?.files.loadFiles("https://www.ebi.ac.uk/pdbe/entry-files/1bxn.cif", "Load 1BXN button");
    };

    return (
        <>
            <header className="site-header">
                <h1>Moorhen Web Component in React</h1>
                <button className="theme-toggle" onClick={switchTheme} aria-label="Toggle dark/light mode">
                    {theme === "dark" ? "☀ Light mode" : "\u{1F319} Dark mode"}
                </button>
            </header>

            <p className="lead">
                An example of integrating Moorhen into a React application with the <code>&lt;Moorhen&gt;</code>{" "}
                component and the hooks from <code>moorhen/web-component/react</code>. The host app runs React{" "}
                <strong>{React.version}</strong>, while the React bundled inside Moorhen is 19.x. Moorhen renders
                in its own shadow root, so the two do not interfere.
            </p>

            <section className="card">
                <h2>Controls</h2>

                <div className="controls">
                    <label>
                        Width
                        <input
                            type="number"
                            min={0}
                            max={3000}
                            step={10}
                            value={width}
                            onChange={(e) => setWidth(Number(e.target.value))}
                        />
                        px
                    </label>
                    <label>
                        Height
                        <input
                            type="number"
                            min={0}
                            max={2000}
                            step={10}
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                        />
                        px
                    </label>
                    <label>
                        Background RGB
                        <input
                            type="number"
                            min={0}
                            max={255}
                            step={1}
                            value={backgroundColor[0] * 255}
                            onChange={(e) =>
                                setBackgroundColor([
                                    Number(e.target.value) / 255,
                                    backgroundColor[1],
                                    backgroundColor[2],
                                ])
                            }
                        />
                        <input
                            type="number"
                            min={0}
                            max={255}
                            step={1}
                            value={backgroundColor[1] * 255}
                            onChange={(e) =>
                                setBackgroundColor([
                                    backgroundColor[0],
                                    Number(e.target.value) / 255,
                                    backgroundColor[2],
                                ])
                            }
                        />
                        <input
                            type="number"
                            min={0}
                            max={255}
                            step={1}
                            value={backgroundColor[2] * 255}
                            onChange={(e) =>
                                setBackgroundColor([
                                    backgroundColor[0],
                                    backgroundColor[1],
                                    Number(e.target.value) / 255,
                                ])
                            }
                        />
                    </label>
                    <button className="button" onClick={() => setViewOnly(!viewOnly)}>
                        View only: {viewOnly ? "on" : "off"}
                    </button>
                    {/* One of Moorhen's UI components outside Moorhen, in the page's own controls. `moorhen` names the
                        Moorhen it works with (optional here: with a single Moorhen in the page, it finds it by itself). */}
                    <MoorhenMoleculeSelect
                        moorhen="my-moorhen"
                        label="Centre on:"
                        onChange={(uniqueId) => instance?.getMolecule(uniqueId as string)?.centreOn()}
                    />
                </div>
            </section>

            <section className="card">
                <h2>Callbacks</h2>

                <p>
                    Load a structure, then hover an atom in the viewer. The lines below are written by three
                    Moorhen callbacks, all registered in <code>useEffect</code>: atom hover, file loading and
                    molecule changes. The molecule count comes from the store, through{" "}
                    <code>useMoorhenSelector</code>.
                </p>

                <div className="controls">
                    <button className="button" onClick={loadExampleStructure}>
                        Load 1BXN
                    </button>
                </div>

                <div className="readouts note-technical">
                    <p>Opened molecules: {openedMolecules?.length ?? 0}</p>
                    <p>Hovered atom: {hoveredAtom ?? "none"}</p>
                    <p>Last load: {lastLoad ?? "none"}</p>
                    <p>Last molecule change: {lastMoleculeChange ?? "none"}</p>
                </div>

                <p className="note">
                    The molecule-change callback reports edits you make in the viewer (mutate, refine,
                    delete&hellip;, through Moorhen&rsquo;s Edit menu or a context menu) and also some internal
                    steps during loading, where it arrives without an <code>action</code> and before the molecule
                    is listed. Use the files-loaded callback as the &ldquo;a file arrived&rdquo; signal.
                </p>
            </section>

            <div className="viewer-container">
                <Moorhen id="my-moorhen" width={width} height={height} viewOnly={viewOnly} onReady={setInstance}>
                    {/* The plugin fills Moorhen's slots and registers itself with this Moorhen */}
                    <ExamplePlugin />
                </Moorhen>
            </div>
        </>
    );
}

export default App;
