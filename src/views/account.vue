<template>
	<div class="content-item">
		<!-- 搜索区域 -->
		<div class="search">
			<div class="search__left">
				<!-- 搜索功能 -->
				<el-select v-model="filterType" style="width: 160px">
					<el-option label="全部类型" :value="0" />
					<el-option v-for="item in types" :key="item.typeId" :label="item.typeName" :value="item.typeId" />
				</el-select>
			</div>
			<div class="search__right">
				<el-button @click="handleBackup">
					一键备份
				</el-button>
				<el-button type="primary" @click="handleAdd">
					新增数据
				</el-button>
			</div>
		</div>

		<!-- 数据表格 -->
		<el-table :data="pagedData" border style="width: 100%;max-height:80%;overflow: auto;">
			<!-- 列定义 -->
			<el-table-column label="序号" type="index" width="60" />
			<el-table-column label="编校知识" prop="promptContent" show-overflow-tooltip />
			<el-table-column label="类型" width="120">
				<template #default="{ row }">
					<el-tag type="primary">
						{{ row.promptTypeName }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="录入专家" prop="inputSpecialist" width="120" />
			<el-table-column label="批准专家" prop="approveSpecialist" width="120" />
			<!-- <el-table-column label="AI提示词" prop="aiPromptContent" show-overflow-tooltip /> -->
			<el-table-column label="创建日期" prop="createTime" width="180" />
			<el-table-column label="操作" width="180" fixed="right">
				<template #default="{ row }">
					<el-button size="small" @click="handleEdit(row)">编辑</el-button>
					<el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<!-- 分页 -->
		<div class="page">
			<el-pagination background layout="total, sizes, prev, pager, next" :total="pagination.total"
				:page-size="pagination.pageSize" @current-change="handelpage" @size-change="handleSizeChange"
				v-model:current-page="pagination.pageNum" />
		</div>
		<!-- 分页组件修改 -->
		<div class="page">
			<el-pagination background layout="total, sizes, prev, pager, next" :total="filteredTableData.length"
				v-model:page-size="pagination.pageSize" v-model:current-page="pagination.pageNum"
				@current-change="handlePageChange" @size-change="handleSizeChange" />
		</div>

		<!-- 表单弹窗 -->
		<el-dialog v-model="formState.dialogVisible" :title="formState.isEdit ? '编辑提示词' : '新增提示词'" width="600px"
			@closed="handleDialogClose">
			<el-form :model="formState.form" :rules="rules" ref="formRef" label-width="100px">
				<el-form-item label="编校知识：" prop="promptContent">
					<el-input v-model="formState.form.promptContent" type="textarea" :rows="3" placeholder="请输入提示词" />
				</el-form-item>

				<el-form-item label="类型：" prop="promptTypeId">
					<el-select v-model="formState.form.promptTypeId" placeholder="请选择类型" style="width: 100%">
						<el-option v-for="item in types" :key="item.typeId" :label="item.typeName"
							:value="item.typeId" />
					</el-select>
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
	getAllChatList,
	savePromptFile
} from '../api/aiChat'
import {
	getPromptType
} from '../api/promptType'

// ==================== 状态管理 ====================
interface PromptItem {
	_id?: string
	promptContent: string
	promptTypeId: number
	inputSpecialist: string
	approveSpecialist: string
	aiPromptContent: string
	createTime?: string
	promptId: number
}


const tableData = ref<PromptItem[]>([])
const formRef = ref<FormInstance>()
const filterType = ref(0)
// ==================== 分页相关状态 ====================
const pagination = reactive({
	pageNum: 1,      // 当前页码
	pageSize: 10,     // 每页条数
	total: 100        // 总数据量
})
const types = ref([
	{ typeId: 1, typeName: '语法检查' },
])


const formState = reactive({
	dialogVisible: false,
	isEdit: false,
	form: {
		promptContent: '',
		promptTypeId: 1,
		inputSpecialist: '',
		approveSpecialist: '',
		aiPromptContent: '',
	} as PromptItem
})
const rules = reactive({
	promptContent: [{ required: true, message: '内容不能为空' }],
	promptTypeId: [{ required: true, message: '请选择类型' }],
	// 其他字段规则...
})



// ==================== 生命周期 ====================
onMounted(() => {
	fetchPromptList()
	fetchTypeList()
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
		// const { data } = await getAllChatList(pagination.pageNum, pagination.pageSize)

		pagination.total = data.total
		tableData.value = data.data.map(item => ({
			...item,
			promptTypeId: Number(item.promptTypeId) // 转换为数字
		}))
	}
	catch (error) {
		ElMessage.error('获取数据失败')
	}
}
// 获取类型
const fetchTypeList = async () => {
	try {
		const { data } = await getPromptType()

		// 在前端添加"全部类型"选项
		types.value =
			data.data.map(item => ({
				typeId: Number(item.typeId),
				typeName: item.typeName
			}))

	}
	catch (error) {
		ElMessage.error('获取数据失败')
	}
}

// 一键备份处理
const handleBackup = async () => {
	try {
		await ElMessageBox.confirm('确定要备份所有提示词数据吗？', '备份确认', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning'
		})

		// 直接调用备份接口，不传任何参数
		const response = await savePromptFile()
		console.log(response)

		if (response.data.code === 200) {
			ElMessage.success('备份成功')
		} else {
			ElMessage.error('备份失败')
		}
	} catch (error) {
		// 用户取消备份不处理
		if (error !== 'cancel') {
			ElMessage.error('备份过程中出错: ' + (error.message || '未知错误'))
		}
	}
}

const handelpage = (val: number) => {
	fetchPromptList()
}
// const handleSizeChange = (val: number) => {
// 	fetchPromptList()
// }



// 提交处理
const handleSubmit = async () => {
	// 先进行表单验证
	try {
		await formRef.value.validate();
	} catch (error) {
		ElMessage.warning('请正确填写表单');
		return;
	}
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
	if (filterType.value == 0) return tableData.value
	return tableData.value.filter(
		item => item.promptTypeId == filterType.value
	)
})
// 分页后的数据
const pagedData = computed(() => {
	const start = (pagination.pageNum - 1) * pagination.pageSize
	const end = start + pagination.pageSize
	return filteredTableData.value.slice(start, end)
})

// ==================== 事件处理 ====================
const handleAdd = () => {
	formState.isEdit = false
	formState.form = {
		promptContent: '',
		promptTypeId: types.value[0].typeId,
		inputSpecialist: '',
		approveSpecialist: '',
		aiPromptContent: '',
		promptId: 0,
	}
	formState.dialogVisible = true
}
const handlePageChange = (val: number) => {
	pagination.pageNum = val
}

const handleSizeChange = (size: number) => {
	pagination.pageSize = size
	pagination.pageNum = 1 // 重置到第一页
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