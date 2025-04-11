import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
	// base: '/ai_chat/',// 打包路径
	// base: '/zwBlog/src/',// 打包路径
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		}
	},
	plugins: [
		vue(),
		AutoImport({
			imports: ['vue', 'vue-router'],
			resolvers: [ElementPlusResolver()], // 自动引入组件
		}),
		Components({
			resolvers: [ElementPlusResolver({ ssr: false, directives: false })],
			dirs: ['src/layout/components', 'src/components'],
			dts: true,
		}),
	],
	server: {
		proxy: {
			'/api': { // 匹配所有以 '/api'开头的请求路径
				target: 'https://hnqx.online', // 代理目标的基础路径
				changeOrigin: true,
				 rewrite: (path) => path.replace(/^\/api/, ''),
			},
		}
	},
    
})
