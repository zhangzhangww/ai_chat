<template>
    <div class="content-item">
      <div class="header">
        <h2>读本列表</h2>
        <el-button type="primary" @click="showAddDialog">添加读本</el-button>
      </div>
  
      <div class="search-bar">
        <el-input v-model="searchParams.readerName" placeholder="读本名称" style="width: 200px" />
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
  
      <el-table :data="readerList" border style="width: 100%;max-height:80%;overflow: auto;">
        <el-table-column prop="readerName" label="读本名称">
          <template #default="{ row }">
            <el-link type="primary" @click="viewFile(row)">{{ row.readerName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="issue" label="期号" />
        <el-table-column prop="clickNumber" label="点击数" />
        <el-table-column prop="downloadNumber" label="下载数" />
        <el-table-column prop="uploadTime" label="上传时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.readerId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
  
      <div class="pagination">
        <el-pagination 
          background 
          v-model:current-page="pagination.pageNum" 
          v-model:page-size="pagination.pageSize"
          :total="pagination.total" 
          @current-change="handlePageChange"
          layout="total, prev, pager, next, jumper" 
        />
      </div>
  
      <reader-form v-model="formVisible" :form-data="formData" :is-edit="isEdit" @submit="handleSubmit" />
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import ReaderForm from '@/components/ReaderForm.vue'
  import readerApi from '@/api/reader'
  
  // 数据状态
  const readerList = ref([])
  const formVisible = ref(false)
  const isEdit = ref(false)
  const formData = ref({})
  
  // 搜索参数
  const searchParams = reactive({
    readerName: '',
    pageNum: 1,
    pageSize: 10
  })
  
  // 分页参数
  const pagination = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })
  
  // 获取数据
  const fetchData = async () => {
    try {
      const params = {
        readerName: searchParams.readerName,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      }
      const res = await readerApi.getReaderList(params)
      readerList.value = res.data.rows || []
      pagination.total = res.data.total || 0
    } catch (error) {
      ElMessage.error('获取数据失败')
      console.error(error)
    }
  }
  
  // 查看文件
  const viewFile = async (row) => {
  try {
    if (!row.readerId) {
      ElMessage.warning('读本ID不存在')
      return
    }
    const fileUrl = readerApi.getFileUrl(row.readerId)
    window.open(fileUrl)
  } catch (error) {
    ElMessage.error('查看文件失败')
    console.error(error)
  }
}
  
  // 显示添加对话框
  const showAddDialog = () => {
    formData.value = {
      readerName: '',
      author: '',
      unit: '',
      issue: '',
      citedArticle: '',
      digitalObjectldentifier: '',
      chineseAbstract: '',
      chineseKeyword: '',
      englishAbstract: '',
      englishKeyword: '',
      readerFile: null
    }
    isEdit.value = false
    formVisible.value = true
  }
  
  // 处理编辑
  const handleEdit = (row) => {
    formData.value = { ...row }
    isEdit.value = true
    formVisible.value = true
  }
  
  // 提交表单
  const handleSubmit = async (form) => {
    try {
      if (isEdit.value) {
        await readerApi.updateReader(form)
        ElMessage.success('更新成功')
      } else {
        await readerApi.addReader(form)
        ElMessage.success('添加成功')
      }
      formVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error('操作失败')
      console.error(error)
    }
  }
  
  // 删除读本
  const handleDelete = (readerId) => {
    console.log(readerId)
    ElMessageBox.confirm('确认删除该读本吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await readerApi.deleteReader(readerId)
        ElMessage.success('删除成功')
        fetchData()
      } catch (error) {
        ElMessage.error('删除失败')
        console.error(error)
      }
    }).catch(() => {})
  }
  
  // 分页变化
  const handlePageChange = () => {
    fetchData()
  }
  
  // 初始化加载数据
  onMounted(() => {
    fetchData()
  })
  </script>
  
  <style scoped>

  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .search-bar {
    margin-bottom: 20px;
  }
  
  .pagination {
    float: right;
    margin-top: 20px;
  }
  </style>