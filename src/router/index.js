import { createRouter, createWebHashHistory } from 'vue-router'
import Cookies from 'js-cookie';
import emitter from '@/utils/emitter'
 
// 创建一个全局状态来管理首次访问状态
const visitedRoutes = new Set()


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
			
			
			
			
		],
	},
	
	{
		path: '/admin',
		component: () => import('@/views/index.vue'), // 首页
		redirect: '/login',
		beforeEnter:(to, from, next) => {
			const token=Cookies.get('token')
			// 判断有没有登录
			if (!token) {
				if (to.name == "login") {
					next();
				} else {
					router.push('/login')
				}
			} else {
				next();
			}
		},
		children: [
			{
				path: '/admin/account',
				name: 'account',
				component: () => import('@/views/account.vue'),
			},
			{
				path: '/admin/knowledge',
				name: 'knowledge',
				component: () => import('@/views/knowledge.vue'),
			},
			{
				path: '/admin/type',
				name: 'type',
				component: () => import('@/views/type.vue'),
			},
			{
				path: '/admin/readerList',
				name: 'readerList',
				component: () => import('@/views/readerList.vue'),
			},
		]
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('@/views/login.vue'),
	},
	{
		path: '/403',
		name: 'forbidden',
		component: () => import('@/views/403.vue'),
	  },
	  // 添加通配符路由，匹配所有未定义的路径
	  {
        path: '/:pathMatch(.*)*',
        redirect: '/403'
    }
	

	


]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
	linkActiveClass: 'active',
})

//路由守卫
router.beforeEach((to, from, next) => {
	if (!visitedRoutes.has(to.path)) {
	  emitter.emit('loading', true)
	}
	next()
  })
   
  router.afterEach((to) => {
	if (!visitedRoutes.has(to.path)) {
	  visitedRoutes.add(to.path)
	  emitter.emit('loading', false)
	}
  })

export default router