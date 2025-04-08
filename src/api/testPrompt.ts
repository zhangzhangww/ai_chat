import http from '../utils/request.js'

//请求全部列表数据（分页）
export const getAllChatList= (pageNum, pageSize) =>{
	//返回一个promise对象
	return http.get(`/chat/testPrompt/list?pageNum=${pageNum}&pageSize=${pageSize}`,)
}

//请求全部列表数据（不分页）
export const getPromptList= () =>{
	//返回一个promise对象
	return http.get(`/chat/testPrompt/getPromptList`)
}




//添加数据
export const addPrompt= (data) =>{
	//返回一个promise对象
	return http.post(`/chat/testPrompt`,data)
}



//更新数据
export const updateList= (data:any) =>{
	//返回一个promise对象
	return http.put(`/chat/testPrompt`,data)
}

//删除数据
export const deleteList= (id:any) =>{
	//返回一个promise对象
	return http.delete(`/chat/testPrompt/${id}`)
}

