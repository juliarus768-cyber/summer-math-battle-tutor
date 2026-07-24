import { defineConfig } from 'vite';

// Stamps a real build timestamp into index.html at build time, replacing the
// __BUILD_ID__ placeholder. This is how the app can show "which version is
// actually loaded" — critical for spotting a stale cached copy on a device.
function injectBuildInfo() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const buildId = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}.${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  return {
    name: 'inject-build-info',
    transformIndexHtml(html) {
      return html.replaceAll('__BUILD_ID__', buildId);
    },
  };
}

export default defineConfig({
  plugins: [injectBuildInfo()],
});
