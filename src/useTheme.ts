import { useEffect, useState } from "react";

const STORAGE_KEY = "moorhen-demo-theme";

export type Theme = "light" | "dark";

function initialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
        return saved;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Theme handling for the demo shell, copied from the Moorhen docs site: the
 * stylesheet follows the OS preference unless data-theme is set on <html>.
 */
export function useTheme(): [Theme, () => void] {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggle = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

    return [theme, toggle];
}
