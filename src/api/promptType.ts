import http from '../utils/request.js'

//请求全部列表数据（分页）
export const getAllTypeList= (pageNum, pageSize) =>{
	//返回一个promise对象
	return http.get(`/chat/promptType/list?pageNum=${pageNum}&pageSize=${pageSize}`,)
}

//请求全部列表数据（不分页）
export const getPromptType= () =>{
	//返回一个promise对象
	return http.get(`/chat/promptType/getPromptTypeList`)
}




//添加数据
export const addPromptType= (data) =>{
	//返回一个promise对象
	return http.post(`/chat/promptType`,data)
}



//更新数据
export const updateListType= (data:any) =>{
	//返回一个promise对象
	return http.put(`/chat/promptType`,data)
}

//删除数据
export const deleteListType= (id:any) =>{
	//返回一个promise对象
	return http.delete(`/chat/promptType/${id}`)
}

