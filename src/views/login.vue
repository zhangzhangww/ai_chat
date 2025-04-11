<template>
	<div class="login-container">
	  <div class="login-box">
		
		<el-form
		  ref="loginFormRef"
		  :model="loginForm"
		  :rules="loginRules"
		  class="login-form"
		  label-position="top"
		>
		  <el-form-item prop="username" label="用户名">
			<el-input
			  v-model="loginForm.username"
			  placeholder="请输入用户名"
			  prefix-icon="User"
			  clearable
			  @keyup.enter="handleLogin"
			/>
		  </el-form-item>
  
		  <el-form-item prop="password" label="密码">
			<el-input
			  v-model="loginForm.password"
			  type="password"
			  placeholder="请输入密码"
			  prefix-icon="Lock"
			  show-password
			  clearable
			  @keyup.enter="handleLogin"
			/>
		  </el-form-item>
  
		  <el-form-item prop="code" label="验证码">
			<div class="captcha-container">
			  <el-input
				v-model="loginForm.code"
				placeholder="请输入验证码"
				prefix-icon="Key"
				class="captcha-input"
				clearable
				@keyup.enter="handleLogin"
			  />
			  <div class="captcha-image" @click="refreshCaptcha">
				<img :src="captchaImage" v-if="captchaImage" alt="验证码" />
				<span v-else class="loading-text">加载验证码...</span>
			  </div>
			</div>
		  </el-form-item>
  
		  <el-form-item>
			<el-button
			  type="primary"
			  class="login-btn"
			  :loading="loading"
			  @click="handleLogin"
			>
			  登 录
			</el-button>
		  </el-form-item>
		</el-form>
	  </div>
  
	  <div class="login-footer">
		<p>版权所有 © 河南省气象局《气象与环境科学》编辑部</p>
	  </div>
	</div>
  </template>
  
  <script setup>
  import Cookies from 'js-cookie'
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { getCaptchaImage, login } from '@/api/user'
  
  const router = useRouter()
  const loginFormRef = ref(null)
  
  // 登录表单数据
  const loginForm = ref({
	username: '',
	password: '',
	code: '',
	uuid: ''
  })
  
  // 验证码图片
  const captchaImage = ref('')
  
  // 加载状态
  const loading = ref(false)
  
  // 表单验证规则
  const loginRules = {
	username: [
	  { required: true, message: '请输入用户名', trigger: 'blur' },
	  { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
	],
	password: [
	  { required: true, message: '请输入密码', trigger: 'blur' },
	  { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
	]
  }
  
  // 获取验证码
  // 获取验证码
const getCaptcha = async () => {
  try {
    const response = await getCaptchaImage()
    console.log('获取验证码成功:', response)
    
    // 存储uuid到登录表单
    loginForm.value.uuid = response.data.uuid
    
    // 直接使用返回的Base64图片数据
    captchaImage.value = 'data:image/jpeg;base64,' + response.data.img
  } catch (error) {
    console.error('获取验证码失败:', error)
    ElMessage.error('获取验证码失败，请重试')
    captchaImage.value = ''
  }
}
  
  // 刷新验证码
  const refreshCaptcha = () => {
	captchaImage.value = ''
	getCaptcha()
  }
  
  // 登录处理
  const handleLogin = async () => {
	try {
	  loading.value = true
	  
	  // 表单验证
	  const valid = await loginFormRef.value?.validate()
	  if (!valid) return
	  
	  // 调用登录接口
	  const response = await login(loginForm.value)
	  
	  // 根据文档，登录成功后需要设置Authorization头
	  const token = response.data.token
	  
	  if (token) {
		// 存储token到store
		// userStore.setToken(token)
		//创建cookies
		Cookies.set('token', token)
		
		// 获取用户信息
		// await userStore.getUserInfo()
		
		// 跳转到首页
		router.push('/admin/account')
		ElMessage.success('登录成功')
	  } else {
		throw new Error('登录失败，未获取到token')
	  }
	} catch (error) {
	  console.error('登录失败:', error)
	  ElMessage.error(error.response?.data?.message || '登录失败，请检查用户名、密码和验证码')
	  // 登录失败刷新验证码
	  refreshCaptcha()
	} finally {
	  loading.value = false
	}
  }
  
  // 组件挂载时获取验证码
  onMounted(() => {
	getCaptcha()
  })
  </script>
  
  <style scoped>
  .login-container {
	width: 100vw;
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: #f0f2f5;
	background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	justify-content: center;
	align-items: center;
	padding: 20px;
  }
  
  .login-box {
	width: 420px;
	padding: 40px;
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
  }
  
  .login-box:hover {
	box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  }
  
 
  
  .login-form {
	margin-top: 20px;
  }
  
  .captcha-container {
	display: flex;
	align-items: center;
	width: 100%;
  }
  
  .captcha-input {
	flex: 1;
	margin-right: 10px;
  }
  
  .captcha-image {
	width: 120px;
	height: 40px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	background-color: #f5f7fa;
  }
  
  .captcha-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
  }
  
  .loading-text {
	color: #999;
	font-size: 12px;
  }
  
  .login-btn {
	width: 100%;
	height: 44px;
	margin-top: 10px;
	font-size: 16px;
	letter-spacing: 2px;
  }
  
  .login-footer {
	margin-top: 30px;
	text-align: center;
	color: #888;
	font-size: 14px;
  }
  
  /* 确保输入框可编辑 */
  :deep(.el-input__inner) {
	background-color: #fff !important;
	color: #333 !important;
  }
  
  /* 响应式设计 */
  @media (max-width: 480px) {
	.login-box {
	  width: 90%;
	  padding: 30px 20px;
	}
	
	.captcha-container {
	  flex-direction: column;
	}
	
	.captcha-input {
	  width: 100%;
	  margin-right: 0;
	  margin-bottom: 10px;
	}
	
	.captcha-image {
	  width: 100%;
	  height: 44px;
	}
  }
  </style>