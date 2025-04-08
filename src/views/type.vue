<template>
	<div class="content-item">
		<!-- 搜索区域 -->
		<div class="header">
        <h2>类型管理</h2>
        <el-button type="primary" @click="handleAdd">新增类型</el-button>
      </div>
		<!-- <div class="search">
			
			<div class="search__right">
				<el-button type="primary" @click="handleAdd">
					新增类型
				</el-button>
			</div>
		</div> -->

		<!-- 数据表格 -->
		<el-table :data="tableData" border style="width: 100%;max-height:80%;overflow: auto;">
			<!-- 列定义 -->
			<el-table-column label="序号" type="index" width="60" />
			<el-table-column label="类型名称" prop="typeName" show-overflow-tooltip />
			
			<el-table-column label="操作" width="180" fixed="right">
				<template #default="{ row }">
					<el-button size="small" @click="handleEdit(row)">编辑</el-button>
					<el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div class="page">
			<el-pagination background layout="total, sizes, prev, pager, next" v-model:total="pagination.total"
				v-model:page-size="pagination.pageSize" @current-change="handelpage" @size-change="handleSizeChange"
				v-model:current-page="pagination.pageNum" />
		</div>

		<!-- 表单弹窗 -->
		<el-dialog v-model="formState.dialogVisible" :title="formState.isEdit ? '编辑类型' : '新增类型'" width="600px"
			@closed="handleDialogClose">
			<el-form :model="formState.form" label-width="100px">
				<el-form-item label="类型名称：" prop="typeName">
					<el-input v-model="formState.form.typeName" type="textarea" :rows="3" placeholder="请输入类型名称" />
				</el-form-item>
				<el-form-item label="排序：" prop="orderNumber">
					<el-input v-model="formState.form.orderNumber" type="text" :rows="3" placeholder="请输入排序" />
				</el-form-item>


				<el-form-item class="dialog-footer">
					<el-button @click="formState.dialogVisible = false">取 消</el-button>
					<el-button type="primary" @click="handleSubmit">确 定</el-button>
				</el-form-item>
			</el-form>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import {
	ElMessage,
	ElMessageBox,
	type FormInstance
} from 'element-plus'
import {
	addPromptType,
	updateListType,
	deleteListType,
	getAllTypeList
} from '../api/promptType'

// ==================== 状态管理 ====================
interface PromptItem {
	_id?: string
	typeName: string
	typeId: number
	orderNumber: number
	
}

const tableData = ref<PromptItem[]>([])
const formRef = ref<FormInstance>()
const filterType = ref('0') // 0-全部 1-语法检查 2-格式检查
// ==================== 分页相关状态 ====================
const pagination = reactive({
	pageNum: 1,      // 当前页码
	pageSize: 10,     // 每页条数
	total: 0         // 总数据量
})


const formState = reactive({
	dialogVisible: false,
	isEdit: false,
	form: {
		typeName: '',
		typeId: 1,
		orderNumber: 1,
	} as PromptItem
})


// ==================== 生命周期 ====================
onMounted(() => {
	fetchPromptList()
})

// ==================== 数据操作 ====================
// 创建FormData
const createFormData = (data: PromptItem) => {
	const formData = new FormData()
	Object.entries(data).forEach(([key, value]) => {
		formData.append(key, String(value))
	})
	return formData
}
// 获取数据列表
const fetchPromptList = async () => {
	try {
		// const { data } = await getPromptList()
		const { data } = await getAllTypeList(pagination.pageNum, pagination.pageSize)

		// tableData.value = data.data
		pagination.total = data.total
		tableData.value = data.rows.map(item => ({
			...item,
			promptType: Number(item.promptType) // 转换为数字
		}))
	}
	catch (error) {
		ElMessage.error('获取数据失败')
	}
}

const handelpage = (val: number) => {
	fetchPromptList()
}
const handleSizeChange = (val: number) => {
	fetchPromptList()
}



// 提交处理
const handleSubmit = async () => {
	try {
		const formData = createFormData(formState.form)
		if (formState.isEdit) {
			await updateListType(formData)
			ElMessage.success('更新成功')
		} else {
			await addPromptType(formData)
			ElMessage.success('添加成功')
		}
		formState.dialogVisible = false
		await fetchPromptList()
	} catch (error) {
		ElMessage.error('操作失败')
	}
}
// ==================== 计算属性 ====================
// const filteredTableData = computed(() => {
// 	if (filterType.value === '0') return tableData.value
// 	return tableData.value.filter(
// 		item => item.promptType.toString() === filterType.value
// 	)
// })

// ==================== 事件处理 ====================
const handleAdd = () => {
	formState.isEdit = false
	formState.form = {
		typeName: '',
		typeId: 1,
		orderNumber: 1,
		
	}
	formState.dialogVisible = true
}

const handleEdit = (row: PromptItem) => {
	formState.isEdit = true
	formState.form = { ...row }
	formState.dialogVisible = true
}

const handleDelete = async (row: PromptItem) => {
	try {
		await ElMessageBox.confirm('确定删除该记录吗？', '警告', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning'
		})
		await deleteListType(row.typeId!)
		ElMessage.success('删除成功')
		await fetchPromptList()
	} catch (error) {
		// 取消删除不处理
	}
}



const handleDialogClose = () => {
	formRef.value?.resetFields()
}
</script>

<style scoped>


.page {
	float: right;
	margin-top: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

.search {
	display: flex;
	justify-content: space-between;
}

.search__right {
	margin-bottom: 20px;
}

.comment {
	margin-bottom: 20px;
}

.comment-status-0 {
	border: 3px solid lightpink;
}

.comment-title {
	display: flex;
	gap: 10px;
	align-items: center;
	margin-bottom: 10px;
}

.comment-nick-name {
	font-weight: bold;
}

.comment-date-time {
	color: #999;
}

.comment-content {
	text-align: justify;
}

.comment-content :deep(.mention) {
	color: dodgerblue;
}
</style>