import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 注意：这里的名字必须和你 GitHub 仓库的名字一模一样，前后都要有斜杠
  base: '/postcard-maker/', 
})