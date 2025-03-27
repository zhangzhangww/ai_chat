import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		component: () => import('@/views/index.vue'), // 首页
		redirect: '/FileAnalysis',
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
			{
				path: '/account',
				name: 'account',
				component: () => import('@/views/account.vue'),
			},
			
			
		],
	},

	


]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
	linkActiveClass: 'active',
})



export default router