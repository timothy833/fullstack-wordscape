import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode })=>{
  // 自動判斷是否在 GitHub Pages 部署
  // ✅ 載入對應環境變數（例如 .env.production）
  const env = loadEnv(mode, process.cwd(), '');

  const isGitHubPages = env.IS_GITHUB_PAGES === 'true';
  const base = isGitHubPages ? '/fullstack-wordscape/' : '/';
  
  return {
    base,
    plugins: [react()]
  }
})
