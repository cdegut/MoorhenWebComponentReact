/**
 * An example Moorhen plugin. The app renders it inside the web component:
 *
 *     <moorhen-web-component id="my-moorhen">
 *         <ExamplePlugin />
 *     </moorhen-web-component>
 *
 * It adds a "Plugin" entry to Moorhen's menu, opening a modal whose content is the plugin's own
 * HTML, given to Moorhen through a slot. The tools in that modal (tools.tsx) are only downloaded and
 * mounted when the user first opens it.
 */
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useMoorhenInstance } from "moorhen/web-component/react";

const PluginTools = lazy(() => import("./tools"));

export function ExamplePlugin() {
    // Inside the web component, so the plugin finds its Moorhen without an id
    const ref = useRef<HTMLDivElement>(null);
    const instance = useMoorhenInstance(ref);
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        if (!instance) return;
        const removeModal = instance.uiExtensions.addModal({
            id: "example-plugin",
            title: "Example plugin",
            slotName: "example-plugin",
            initialWidth: 420,
            onOpen: () => setOpened(true),
        });
        const removeMenu = instance.menuSystem?.addMainMenu({ type: "modal", label: "Plugin", icon: "MatSymAdd", modal: "example-plugin" });
        return () => {
            removeModal();
            removeMenu?.();
        };
    }, [instance]);

    return (
        <div slot="example-plugin" ref={ref}>
            {opened ? (
                <Suspense fallback={<p>Loading…</p>}>
                    <PluginTools />
                </Suspense>
            ) : null}
        </div>
    );
}
