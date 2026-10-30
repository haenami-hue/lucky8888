import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // 배포 주소 (끝에 / 포함). 카카오톡 미리보기 이미지는 절대 주소여야 해서 빌드 때 넣는다.
  //   PowerShell: $env:SITE_URL="https://example.com/lotto/"; npm run build   (또는 .env 에 SITE_URL=...)
  const SITE_URL = loadEnv(mode, ".", "SITE_").SITE_URL ?? "";
  return {
    base: "./",
    // 빌드 결과물은 감시하지 않는다 (dist.zip 을 압축·열람 중이면 EBUSY 로 개발 서버가 죽음)
    server: { host: true, watch: { ignored: ["**/dist/**", "**/*.zip"] } },
    plugins: [
      react(),
      { name: "site-url", transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", SITE_URL) },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/icon.svg"],
        manifest: {
          name: "행운로또 - 사주로 뽑는 로또번호",
          short_name: "행운로또",
          description: "로또 6/45 통계와 질문·사주 기반 번호 추천",
          lang: "ko",
          start_url: "./",
          scope: "./",
          display: "standalone",
          orientation: "portrait",
          background_color: "#efe6ff",
          theme_color: "#8b5cff",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png}"],
          // 링크 미리보기용 이미지는 앱에서 쓰지 않으므로 미리 받지 않는다
          globIgnores: ["og-image.png"],
          runtimeCaching: [
            // 제목용 웹폰트도 받아 두어 오프라인에서도 같은 모양으로 보이게 한다
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            // 당첨 데이터는 새 회차를 빨리 받도록 네트워크 우선, 오프라인이면 캐시
            {
              urlPattern: /data\/draws\.json$/,
              handler: "NetworkFirst",
              options: { cacheName: "draws", networkTimeoutSeconds: 4 },
            },
          ],
        },
      }),
    ],
  };
});
