import { useEffect, useState } from "react";
import { MoorhenWebComponentAttributes, registerMoorhenWebComponent } from "moorhen/web-component";
import React from "react";
import "./App.css";
import { useMoorhenSelector, useWebComponentInstanceRef } from "moorhen/hooks";

registerMoorhenWebComponent();

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

    const moorhenInstanceRef = useWebComponentInstanceRef("my-moorhen");
    const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);

    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }
        moorhenInstanceRef.current.width = width;
        moorhenInstanceRef.current.height = height;
    }, [width, height]);

    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }
    }, []);

    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }
        moorhenInstanceRef.current.sceneSettings.setBackgroundColor([...backgroundColor, 255]);
    }, [backgroundColor]);

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
            </div>

            <div className="viewer-container">
                <moorhen-web-component width={width} height={height} id="my-moorhen" />
            </div>
        </div>
    );
}

export default App;
