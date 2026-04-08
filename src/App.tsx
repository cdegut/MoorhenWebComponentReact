import { useEffect, useState } from "react";
import React from "react";
import "./MyMoorhen";
import "./App.css";
import { MyMoorhen } from "./MyMoorhen";

function App() {
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(768);
    useEffect(() => {
        const myMoorhenElement = document.getElementById("my-moorhen") as MyMoorhen;
        const moorhenInstance = myMoorhenElement.moorhenInstance;
        if (!moorhenInstance) {
            return;
        }
        moorhenInstance.width = width;
        moorhenInstance.height = height;
    }, [width, height]);

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
            </header>

            <div className="controls">
                <label>
                    Width
                    <input
                        type="number"
                        min={200}
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
                        min={200}
                        max={2000}
                        step={10}
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                    />
                    px
                </label>
            </div>

            <div className="viewer-container">
                <my-moorhen id="my-moorhen" />
            </div>
        </div>
    );
}

export default App;
