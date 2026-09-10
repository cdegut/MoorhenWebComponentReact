import { useEffect, useState } from "react";
import { MoorhenWebComponentAttributes } from "moorhen/web-component";
import React from "react";
import "./App.css";
import { useMoorhenSelector, useWebComponentInstanceRef } from "moorhen/web-component/utils";
import { useTheme } from "./useTheme";



declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "moorhen-web-component": MoorhenWebComponentAttributes;
        }
    }
}

function App() {
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(768);
    const [backgroundColor, setBackgroundColor] = useState<[number, number, number]>([1, 1, 1]);

    const [isReady, moorhenInstanceRef] = useWebComponentInstanceRef("my-moorhen");
    const [viewOnly, setViewOnly] = useState(false);
    const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
    const [lastLoad, setLastLoad] = useState<string | null>(null);
    const [lastMoleculeChange, setLastMoleculeChange] = useState<string | null>(null);
    const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);
    const [theme, toggleTheme] = useTheme();


    // I am not sure there is a better way than using effect hooks to update the web component when the state changes.
    // Mutating refs directly render is supposed to be a bad thing too...
    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }     
        moorhenInstanceRef.current.height = height;
        moorhenInstanceRef.current.width = width;
    }, [width, height, moorhenInstanceRef]);

    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }
        moorhenInstanceRef.current.sceneSettings.setBackgroundColor([...backgroundColor, 255]);
    }, [backgroundColor, moorhenInstanceRef]);

    // Tie the 3D viewport to the page theme: switching theme resets the
    // background to match, and the colour inputs above stay in sync. Pick a
    // colour by hand afterwards if you want to override it.
    useEffect(() => {
        setBackgroundColor(theme === "dark" ? [27 / 255, 30 / 255, 34 / 255] : [1, 1, 1]);
    }, [theme]);

    // Moorhen callbacks are plain subscriptions: register them once the instance
    // exists, and return the unsubscribe functions they hand back. `isReady` is
    // the dependency that matters here, because a ref changing does not re-render.
    useEffect(() => {
        const instance = moorhenInstanceRef.current;
        if (!isReady || !instance) {
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
    }, [isReady, moorhenInstanceRef]);

    const loadExampleStructure = () => {
        // The second argument is an optional label; the files-loaded callback
        // receives it back as `origin`, which is handy when several parts of
        // your app load files.
        moorhenInstanceRef.current?.files.loadFiles(
            "https://www.ebi.ac.uk/pdbe/entry-files/1bxn.cif",
            "Load 1BXN button",
        );
    };

    return (
        <>
            <header className="site-header">
                <h1>Moorhen Web Component in React</h1>
                <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark/light mode">
                    {theme === "dark" ? "\u2600 Light mode" : "\u{1F319} Dark mode"}
                </button>
            </header>

            <p className="lead">
                An example of integrating the <code>&lt;moorhen-web-component&gt;</code> element into a React
                application and driving it with the <code>useWebComponentInstanceRef</code> and{" "}
                <code>useMoorhenSelector</code> hooks. The host app runs React {React.version}, while the React
                bundled inside Moorhen is 19.x. The element renders in its own shadow root, so the two do not
                interfere.
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
                            onChange={(e) => {
                                const newWidth = Number(e.target.value);
                                if (moorhenInstanceRef.current) {
                                    moorhenInstanceRef.current.width = newWidth;
                                }
                                setWidth(newWidth);
                            }}
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
                            onChange={(e) => {
                                const newHeight = Number(e.target.value);
                                if (moorhenInstanceRef.current) {
                                    moorhenInstanceRef.current.height = newHeight;
                                }
                                setHeight(newHeight);
                            }}
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
                <moorhen-web-component width={width} height={height} id="my-moorhen" view-only={viewOnly} />
            </div>
        </>
    );
}

export default App;
