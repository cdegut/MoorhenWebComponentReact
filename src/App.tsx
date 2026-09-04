import { useEffect, useState } from "react";
import { MoorhenWebComponentAttributes, registerMoorhenWebComponent } from "moorhen/web-component";
import React from "react";
import "./App.css";
import { useMoorhenSelector, useWebComponentInstanceRef } from "moorhen/web-component/utils";


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
    const [width, setWidth] = useState(1600);
    const [height, setHeight] = useState(1200);
    const [backgroundColor, setBackgroundColor] = useState<[number, number, number]>([1, 1, 1]);

    const [ready ,moorhenInstanceRef] = useWebComponentInstanceRef("my-moorhen");
    const openedMolecules = useMoorhenSelector("my-moorhen", (state) => state.molecules.moleculeList);

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

    useEffect(() => {
        if (!moorhenInstanceRef.current) {
            return;
        }
        moorhenInstanceRef.current.menuSystem?.addMainMenu({
            type: "sub-menu",
            label: "Extra Menu",
            icon: "MatSymAdd",
            menu: "extra-menu",
            align: 5,
        }, 2);

        moorhenInstanceRef.current.menuSystem?.addSubmenu({
            "extra-menu": {
                label: "Extra",
                items: [
                    {id: "my-menu-slot", label: "Menu Slot", type: "HTMLslot", slotName: "custom-menu"},
                ],
            }})
        }, [moorhenInstanceRef, ready]);

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
                <moorhen-web-component width={width} height={height} id="my-moorhen">
                        <div slot="custom-menu"><moorhen-web-component width={500} height={500}/></div>
                </moorhen-web-component>
            </div>
        </div>
    );
}

export default App;
