import http from '../utils/request.js'

//请求全部列表数据（分页）
export const getAllChatList= (data) =>{
	//返回一个promise对象
	return http.get(`/chat/prompt/list`,data)
}

//请求全部列表数据（不分页）
export const getPromptList= () =>{
	//返回一个promise对象
	return http.get(`/chat/prompt/getPromptList`)
}




//添加数据
export const addPrompt= (data) =>{
	//返回一个promise对象
	return http.post(`/chat/prompt`,data)
}



//更新数据
export const updateList= (data:any) =>{
	//返回一个promise对象
	return http.post(`/chat/prompt`,data)
}

//删除数据
export const deleteList= (id:any) =>{
	//返回一个promise对象
	return http.delete(`/chat/prompt/${id}`)
}

