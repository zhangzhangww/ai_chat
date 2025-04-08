<template>
    <el-dialog 
      :title="isEdit ? '编辑读本' : '添加读本'" 
      v-model="visible" 
      width="50%"
      @close="handleClose"
    >
      <el-form :model="form" ref="formRef" label-width="120px">
        <el-form-item label="读本名称" prop="readerName" :rules="[{ required: true, message: '请输入读本名称' }]">
          <el-input v-model="form.readerName" />
        </el-form-item>
        
        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" />
        </el-form-item>
        
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" />
        </el-form-item>
        
        <el-form-item label="期号" prop="issue">
          <el-input v-model="form.issue" />
        </el-form-item>
        
        <el-form-item label="引用本文" prop="citedArticle">
          <el-input v-model="form.citedArticle" type="textarea" />
        </el-form-item>
        
        <el-form-item label="读本标识符" prop="digitalObjectldentifier" 
          :rules="[{ required: true, message: '请输入读本标识符' }]">
          <el-input v-model="form.digitalObjectldentifier" />
        </el-form-item>
        
        <el-form-item label="中文摘要" prop="chineseAbstract">
          <el-input v-model="form.chineseAbstract" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="中文关键词" prop="chineseKeyword">
          <el-input v-model="form.chineseKeyword" />
        </el-form-item>
        
        <el-form-item label="英文摘要" prop="englishAbstract">
          <el-input v-model="form.englishAbstract" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="英文关键词" prop="englishKeyword">
          <el-input v-model="form.englishKeyword" />
        </el-form-item>
        
        <el-form-item label="文件" prop="readerFile" :rules="[{ required: !isEdit, message: '请选择文件' }]">
          <el-upload
            class="upload-demo"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip" v-if="isEdit">
                当前文件: {{ form.filePath?.split('/')?.pop() }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item v-if="isEdit" label="读本ID" prop="readerld">
          <el-input v-model="form.readerld" disabled />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  
  const props = defineProps({
    modelValue: Boolean,
    formData: Object,
    isEdit: Boolean
  })
  
  const emit = defineEmits(['update:modelValue', 'submit'])
  
  const visible = ref(false)
  const formRef = ref(null)
  const fileList = ref([])
  const form = ref({
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
    readerFile: null,
    readerld: ''
  })
  
  watch(() => props.modelValue, (val) => {
    visible.value = val
    if (val) {
      form.value = { ...props.formData }
      fileList.value = []
    }
  })
  
  watch(visible, (val) => {
    emit('update:modelValue', val)
  })
  
  const handleFileChange = (file) => {
    form.value.readerFile = file.raw
  }
  
  const submitForm = () => {
    formRef.value.validate(async (valid) => {
      if (valid) {
        const formData = new FormData()
        for (const key in form.value) {
          if (form.value[key] !== null && form.value[key] !== undefined) {
            formData.append(key, form.value[key])
          }
        }
        emit('submit', formData)
      } else {
        ElMessage.error('请填写完整信息')
      }
    })
  }
  
  const handleClose = () => {
    formRef.value.resetFields()
    fileList.value = []
  }
  </script>