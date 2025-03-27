<template>
	<div class="content-item">
		<!-- 搜索区域 -->
		<div class="search">
			<div class="search__left">
				<!-- 搜索功能 -->
				<el-radio-group v-model="filterType" @change="handleFilterChange">
					<el-radio-button label="0">全部类型</el-radio-button>
					<el-radio-button label="1">语法检查</el-radio-button>
					<el-radio-button label="2">格式检查</el-radio-button>
				</el-radio-group>
			</div>
			<div class="search__right">
				<el-button type="primary" @click="handleAdd">
					<el-icon class="el-icon--left"></el-icon>新增数据
				</el-button>
			</div>
		</div>

		<!-- 数据表格 -->
		<el-table :data="filteredTableData" border style="width: 100%;height:80%;overflow: auto;">
			<!-- 列定义 -->
			<el-table-column label="序号" type="index" width="60" />
			<el-table-column label="编校知识" prop="promptContent" show-overflow-tooltip />
			<el-table-column label="类型" width="120">
				<template #default="{ row }">
					<el-tag :type="row.promptType == 1 ? 'primary' : 'success'" size="small">
						{{ row.promptType == 1 ? '语法检查' : '格式检查' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="录入专家" prop="inputSpecialist" width="120" />
			<el-table-column label="批准专家" prop="approveSpecialist" width="120" />
			<el-table-column label="AI提示词" prop="aiPromptContent" show-overflow-tooltip />
			<el-table-column label="创建日期" prop="createTime" width="180" />
			<el-table-column label="操作" width="180" fixed="right">
				<template #default="{ row }">
					<el-button size="small" @click="handleEdit(row)">编辑</el-button>
					<el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<!-- <div class="page">
			<el-pagination background layout="total, sizes, prev, pager, next" v-model:total="pagination.total"
				v-model:page-size="pagination.pageSize" @current-change="handelpage" @size-change="handleSizeChange"
				v-model:current-page="pagination.pageNum" />
		</div> -->

		<!-- 表单弹窗 -->
		<el-dialog v-model="formState.dialogVisible" :title="formState.isEdit ? '编辑提示词' : '新增提示词'" width="600px"
			@closed="handleDialogClose">
			<el-form :model="formState.form" label-width="100px">
				<el-form-item label="编校知识：" prop="promptContent">
					<el-input v-model="formState.form.promptContent" type="textarea" :rows="3" placeholder="请输入提示词" />
				</el-form-item>

				<el-form-item label="类型：" prop="promptType">
					<el-radio-group v-model="formState.form.promptType">
						<el-radio :value="1">语法检查</el-radio>
						<el-radio :value="2">格式检查</el-radio>
					</el-radio-group>
				</el-form-item>

				<el-form-item label="录入专家：" prop="inputSpecialist">
					<el-input v-model="formState.form.inputSpecialist" placeholder="请输入录入专家" />
				</el-form-item>

				<el-form-item label="批准专家：" prop="approveSpecialist">
					<el-input v-model="formState.form.approveSpecialist" placeholder="请输入批准专家" />
				</el-form-item>

				<el-form-item label="AI提示词：" prop="aiPromptContent">
					<el-input v-model="formState.form.aiPromptContent" type="textarea" :rows="3"
						placeholder="请输入AI提示词" />
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
	getPromptList,
	addPrompt,
	updateList,
	deleteList,
	getAllChatList
} from '../api/aiChat'

// ==================== 状态管理 ====================
interface PromptItem {
	_id?: string
	promptContent: string
	promptType: number
	inputSpecialist: string
	approveSpecialist: string
	aiPromptContent: string
	createTime?: string
	promptId: number
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
		promptContent: '',
		promptType: 1,
		inputSpecialist: '',
		approveSpecialist: '',
		aiPromptContent: '',
	} as PromptItem
})
const typeOptions = reactive([
	{ label: '语法检查', value: 1 },
	{ label: '格式检查', value: 2 }
])

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
		const { data } = await getPromptList()
		// const { data } = await getAllChatList(formData)

		// tableData.value = data.data
		pagination.total = data.total
		tableData.value = data.data.map(item => ({
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
			await updateList(formData)
			ElMessage.success('更新成功')
		} else {
			await addPrompt(formData)
			ElMessage.success('添加成功')
		}
		formState.dialogVisible = false
		await fetchPromptList()
	} catch (error) {
		ElMessage.error('操作失败')
	}
}
// ==================== 计算属性 ====================
const filteredTableData = computed(() => {
	if (filterType.value === '0') return tableData.value
	return tableData.value.filter(
		item => item.promptType.toString() === filterType.value
	)
})

// ==================== 事件处理 ====================
const handleAdd = () => {
	formState.isEdit = false
	formState.form = {
		promptContent: '',
		promptType: 1,
		inputSpecialist: '',
		approveSpecialist: '',
		aiPromptContent: '',
		promptId: 0,
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
		await deleteList(row.promptId!)
		ElMessage.success('删除成功')
		await fetchPromptList()
	} catch (error) {
		// 取消删除不处理
	}
}

const handleFilterChange = (val: string) => {
	console.log('筛选类型变更:', val)
	// 可以在此处添加额外的筛选逻辑（如需要服务端筛选时）
}


const handleDialogClose = () => {
	formRef.value?.resetFields()
}
</script>

<style scoped>
.content-item {
	margin: 16px;
	padding: 32px;
	width: 98%;
	background: #ffffff;
	height: 96%;

}

.page {
	float: right;
	margin-top: 20px;
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