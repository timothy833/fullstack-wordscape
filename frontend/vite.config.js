import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// 自動判斷是否在 GitHub Pages 部署
const isGitHubPages = process.env.IS_GITHUB_PAGES === 'true';
const base = isGitHubPages ? '/fullstack-wordscape/' : '/';

// https://vite.dev/config/
export default defineConfig(()=>{
  return {
    base,
    plugins: [react()]
  }
})
