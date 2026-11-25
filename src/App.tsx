import { useEffect, useState } from "react";
import React from "react";
import { registerMoorhenWebComponent, type MoorhenInstance } from "moorhen/web-component";
import { Moorhen, MoorhenMoleculeSelect, useMoorhenSelector } from "moorhen/web-component/react";
import "./App.css";
import { ExamplePlugin } from "./plugin";

// Defines <moorhen-web-component> and Moorhen's UI elements, used by <Moorhen> and the plugin
registerMoorhenWebComponent();

function App() {
    const [width, setWidth] = useState(1600);
    const [height, setHeight] = useState(1200);
    const [backgroundColor, setBackgroundColor] = useState<[number, number, number]>([1, 1, 1]);

    // The instance, once Moorhen is ready (onReady below), and a value of its state
    const [instance, setInstance] = useState<MoorhenInstance | null>(null);
    const openedMolecules = useMoorhenSelector("my-moorhen", state => state.molecules.moleculeList);

    useEffect(() => {
        instance?.sceneSettings.setBackgroundColor([...backgroundColor, 1]);
    }, [instance, backgroundColor]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Moorhen Web Component — React Demo</h1>
                <p>
                    An example of integrating the <code>&lt;my-moorhen&gt;</code> web component into a React
                    application.
                    <br />
                    This uses React version: <strong>{React.version}</strong> while Moorhen use version{" "}
                    <strong> 19.2.0</strong>
                </p>
                <p>
                    Opened molecules: <strong>{openedMolecules?.length}</strong>
                </p>
            </header>

            <div className="controls">
                <label>
                    Width
                    <input
                        type="number"
                        min={0}
                        max={3000}
                        step={10}
                        value={width}
                        onChange={e => setWidth(Number(e.target.value))}
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
                        onChange={e => setHeight(Number(e.target.value))}
                    />
                    px
                </label>
                <label>
                    Background Colour RGB
                    <input
                        type="number"
                        min={0}
                        max={255}
                        step={1}
                        value={backgroundColor[0] * 255}
                        onChange={(e) =>
                            setBackgroundColor([Number(e.target.value) / 255, backgroundColor[1], backgroundColor[2]])
                        }
                    />
                    <input
                        type="number"
                        min={0}
                        max={255}
                        step={1}
                        value={backgroundColor[1] * 255}
                        onChange={(e) =>
                            setBackgroundColor([backgroundColor[0], Number(e.target.value) / 255, backgroundColor[2]])
                        }
                    />
                    <input
                        type="number"
                        min={0}
                        max={255}
                        step={1}
                        value={backgroundColor[2] * 255}
                        onChange={(e) =>
                            setBackgroundColor([backgroundColor[0], backgroundColor[1], Number(e.target.value) / 255])
                        }
                    />
                </label>
                {/* One of Moorhen's UI components outside Moorhen, in the page's own controls. `moorhen` names the
                    Moorhen it works with (optional here: with a single Moorhen in the page, it finds it by itself). */}
                <MoorhenMoleculeSelect
                    moorhen="my-moorhen"
                    label="Centre on:"
                    onChange={uniqueId => instance?.getMolecule(uniqueId as string)?.centreOn()}
                />
            </div>

            <div className="viewer-container">
                <Moorhen id="my-moorhen" width={width} height={height} onReady={setInstance}>
                    {/* The plugin fills Moorhen's slots and registers itself with this Moorhen */}
                    <ExamplePlugin />
                </Moorhen>
            </div>
        </div>
    );
}

export default App;
