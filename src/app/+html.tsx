import { ScrollViewStyleReset } from 'expo-router/html';
import type React from 'react';

// Web HTML shell — injected around every static page Expo Router renders.
export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sk">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <ScrollViewStyleReset />

                {/* Inter via Google Fonts — avoids bundled-asset 404 on Vercel */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                {/* @ts-ignore crossOrigin is valid HTML but TS types are strict here */}
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />

                <style dangerouslySetInnerHTML={{ __html: `
                    * { box-sizing: border-box; }
                    body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
                    #root, #__next { display: flex; flex-direction: column; flex: 1; }
                ` }} />

                {/* Polyfill: CSSStyleDeclaration indexed property setter was removed in Chrome 108.
                    react-native-web's inline-style-prefixer still uses it in some paths. */}
                <script dangerouslySetInnerHTML={{ __html: `
(function(){
  try {
    var p = CSSStyleDeclaration.prototype;
    for (var i = 0; i < 150; i++) {
      if (!(String(i) in p)) {
        Object.defineProperty(p, String(i), {
          configurable: true, enumerable: false,
          set: function() {}, get: function() { return ''; }
        });
      }
    }
  } catch(e) {}
})();
                ` }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
