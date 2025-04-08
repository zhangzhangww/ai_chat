

import http from '../utils/request.js'



export default {
  // 获取读本列表
  getReaderList(params) {
    return http.get('/chat/reader/list', { params })
  },
  
  // 添加读本
  addReader(formData) {
    return http.post('/chat/reader', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 更新读本
  updateReader(formData) {
    return http.put('/chat/reader', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 删除读本
  deleteReader(readerId) {
    return http.delete(`/chat/reader/${readerId}`)
  },
  
  // 批量删除
  batchDeleteReader(readerIds) {
    return http.delete('/chat/reader', { data: { ids: readerIds } })
  },

  // 获取文件URL（新增）
  getFileUrl(readerId) {
    return `${http.defaults.baseURL}/chat/reader/viewFile?readerId=${readerId}`

  },

}