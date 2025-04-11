// src/api/user.js
import http from '../utils/request.js'

// 验证码
export const getCaptchaImage= () =>{
	//返回一个promise对象
	return http.get(`/chat/captchaImage`,)
}


// 登录

export const login= (data) =>{
	//返回一个promise对象
	return http.post(`/chat/login`,data)
}

// 获取用户信息

export const getInfo= () =>{
	//返回一个promise对象
	return http.get(`/chat/getInfo`)
}

