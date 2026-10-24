import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/500.css";
import "@fontsource/bodoni-moda/700.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/800.css";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/caveat/700.css";
import "@fontsource/archivo-black/400.css";
import "@fontsource/courier-prime/700.css";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

export const FONT = {
  sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  didone: '"Bodoni Moda", Didot, "Times New Roman", serif',
  display: '"Playfair Display", Georgia, serif',
  mono: '"JetBrains Mono", Menlo, monospace',
  hand: '"Caveat", "Comic Sans MS", cursive',
  black: '"Archivo Black", "Arial Black", sans-serif',
  typewriter: '"Courier Prime", Courier, monospace',
};

const FACES = [
  "400 40px Inter", "500 40px Inter", "600 40px Inter", "700 40px Inter", "800 40px Inter", "900 40px Inter",
  "400 40px 'Instrument Serif'", "italic 400 40px 'Instrument Serif'",
  "400 40px 'Bodoni Moda'", "500 40px 'Bodoni Moda'", "700 40px 'Bodoni Moda'", "italic 400 40px 'Bodoni Moda'",
  "700 40px 'Playfair Display'", "800 40px 'Playfair Display'", "italic 700 40px 'Playfair Display'", "italic 400 40px 'Playfair Display'",
  "500 40px 'JetBrains Mono'", "700 40px 'JetBrains Mono'",
  "700 40px Caveat", "400 40px 'Archivo Black'", "700 40px 'Courier Prime'",
];

/**
 * Holds rendering until every font face is loaded, so text never renders (or gets
 * measured) in a fallback font. Children mount only once fonts are ready.
 */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f, "AaBb09%")))
      .then(() => document.fonts.ready)
      .catch((e) => console.warn("Font load failed", e))
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};

let canvas: HTMLCanvasElement | null = null;
/** Width in px of `text` set in a CSS font shorthand, e.g. "500 100px 'Bodoni Moda'". */
export function measureText(text: string, font: string, letterSpacingPx = 0): number {
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  return ctx.measureText(text).width + letterSpacingPx * Math.max(0, [...text].length - 1);
}

/** Largest font size (px) at which `text` fits `maxWidth`. `font` is a shorthand without size, e.g. "500 'Bodoni Moda'". */
export function fitFontSize(text: string, font: string, maxWidth: number, letterSpacingEm = 0, max = 1000): number {
  const [style, family] = splitFont(font);
  const w100 = measureText(text, `${style} 100px ${family}`, letterSpacingEm * 100);
  return Math.min(max, (100 * maxWidth) / Math.max(1, w100));
}
const splitFont = (font: string): [string, string] => {
  const m = font.match(/^((?:italic\s+)?\d{3})\s+(.+)$/);
  return m ? [m[1], m[2]] : ["400", font];
};
