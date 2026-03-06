import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("sigaf_theme") || "light");
  const [palette, setPaletteState] = useState(localStorage.getItem("sigaf_palette") || "professional");

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", theme === "dark");
    if (palette === "oxxo") {
      html.setAttribute("data-palette", "oxxo");
    } else {
      html.removeAttribute("data-palette");
    }
    localStorage.setItem("sigaf_theme", theme);
    localStorage.setItem("sigaf_palette", palette);
  }, [theme, palette]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");
  const setPalette = (p) => setPaletteState(p);

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
