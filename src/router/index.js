import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		component: () => import('@/views/index.vue'), // 首页
		redirect: '/home',
		children: [
			{
				path: '/home',
				name: 'home',
				component: () => import('@/views/home.vue'),
			},
			{
				path: '/FileAnalysis',
				name: 'FileAnalysis',
				component: () => import('@/views/FileAnalysis.vue'),
			},
			
			
		],
	},

	


]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})



export default router