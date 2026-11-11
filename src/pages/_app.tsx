import "@/styles/globals.css";
import "@/styles/not-found.css";
import type { AppProps } from "next/app";
import { Lora } from "next/font/google";

// The site lives in src/app. This folder only holds the static 500 page, which
// Next serves when a page fails the first time it is generated (a story opened
// while WordPress is down), so it gets the same styles and heading font here.
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-lora: ${lora.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
