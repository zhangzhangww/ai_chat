<template>
  <div class="container">
    <h1 style="font-size: 32px;">科技文章全文智能编校系统（v1.0）</h1>

    <!-- 通用文件上传区域 -->
    <div class="upload-section">
      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".txt,.docx" :disabled="isProcessing || isQuickChecking" />
      
    </div>

    <!-- 检查方式选择 -->
    <div class="check-options">
      <!-- 按错误类型校对 -->
      <div class="check-option type-based">
        <h3>按类型校对</h3>
        <div class="option-content">
          <el-select v-model="radio" style="width: 100%;" @change="handleTypeChange" :disabled="!selectedFile">
            <el-option v-for="item in types" :key="item.typeId" :label="item.typeName" :value="item.typeId" />
          </el-select>
          <button @click="startAnalysis" :disabled="!selectedFile || isProcessing || isQuickChecking" class="check-btn">
            {{ isProcessing ? '分析中...' : '开始校对' }}
          </button>
        </div>
      </div>

      <!-- 一键全文校对 -->
      <div class="check-option quick-check">
        <h3>一键全文校对   <span style="float: right;font-size: 14px;color: #67c23a;cursor: pointer;" @click="showTypeDialog">自定义选择</span></h3>   
        <div class="option-content">
          <span style="color: #999999;height: 32px;font-size: 14px;overflow: hidden;">对文章的标题、摘要、正文、参考文献等校对（时间较长，约10分钟左右）</span>
          <button @click="quickCheck" :disabled="!selectedFile || isQuickChecking || isProcessing" class="check-btn quick-check-btn">
            {{ isQuickChecking ? '校对中...' : '一键全文校对' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 类型选择对话框 -->
    <el-dialog 
    v-model="typeDialogVisible" 
    title="选择校对类型" 
    width="50%"
    class="type-select-dialog"
  >
    <div class="dialog-header">
      <div class="select-actions">
        <el-button link type="primary" @click="selectAllTypes">全选</el-button>
        <el-button link type="primary" @click="clearAllTypes">清空</el-button>
      </div>
      <div class="selected-count">已选择 {{ selectedTypeIds.length }}/{{ types.length }} </div>
    </div>
    
    <div class="dialog-content">
      <el-checkbox-group v-model="selectedTypeIds">
        <el-checkbox 
          v-for="type in types" 
          :key="type.typeId" 
          :value="type.typeId"
          class="type-checkbox"
        >
          <span class="type-name">{{ type.typeName }}</span>
        </el-checkbox>
      </el-checkbox-group>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button  @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTypeSelection" :disabled="selectedTypeIds.length === 0">
          确定 ({{ selectedTypeIds.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
    
    <div class="file-type-tips">
      <ul>
        <li>（1）选择需要修改的文件上传(docx/txt,文件小于50M)</li>
        <li>（2）选择校对方式：按类型校对或一键全文校对</li>
        <li>（3）点击对应按钮开始校对</li>
      </ul>
    </div>

    <div v-if="status.message" :class="['status', status.type]">
      <span v-if="isProcessing || isQuickChecking" class="loader"></span>
      {{ status.message }}
    </div>
    
    <p v-if="copiedUrlMessage" class="copied-message">{{ copiedUrlMessage }}</p>
    
    <div v-if="analysisResult" class="result-section">
      <div class="title">
        <h2>分析结果</h2>
        <div class="Function">
          <el-button type="primary" @click="copyText(analysisResult)" text bg>复制内容</el-button>
          <el-button type="primary" @click="exportToWord">
            {{ isExporting ? '生成中...' : '生成Word文档' }}
          </el-button>
        </div>
      </div>
      <div class="result-content" v-html="markdownToHtml(analysisResult)"></div>
      <button @click="resetAll" class="reset-btn">新的分析</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import * as mammoth from 'mammoth';
import { Document, Paragraph, Packer, TextRun } from "docx";
import { saveAs } from 'file-saver';
import { getPromptList} from '../api/aiChat';
import { getPromptType } from '../api/promptType';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// 响应式变量
const selectedFile = ref(null);
const analysisResult = ref('');
const isProcessing = ref(false);
const isQuickChecking = ref(false);
const isExporting = ref(false);
const copiedUrlMessage = ref('');
const fileInput = ref(null);
const quickFileInput = ref(null);
const abortController = ref(new AbortController());

// 检查规则相关
const radio = ref(0);
const types = ref([]);
const promptList = ref([]);
const currentPromptContent = ref('');
const customPrompt = ref('');

const model = ref('deepseek-ai/DeepSeek-V3');

const status = reactive({
  message: '',
  type: 'info'
});

// 计算属性
const buttonText = computed(() => {
  return isProcessing.value ? '分析中...' : 
         selectedFile.value ? '按错误类型校对' : '请选择文件';
});

const activePromptContent = computed(() => {
  return radio.value === 0 ? customPrompt.value : currentPromptContent.value;
});

// 生命周期钩子
onMounted(() => {
  fetchTypeList();
  marked.setOptions({
    highlight: code => hljs.highlightAuto(code).value,
    sanitize: true
  });
});


// Markdown 转 HTML（带代码高亮）
const markdownToHtml = (content) => {
  return marked(content);
}

// 新增响应式变量
const typeDialogVisible = ref(false);
const selectedTypeIds = ref([77,78,68,79,61,72,85,71,58,59,82,73]);

// 显示类型选择对话框
const showTypeDialog = () => {
  // selectedTypeIds.value = types.value.map(type => type.typeId); // 默认全选
  typeDialogVisible.value = true;
  
};


// 确认类型选择
const confirmTypeSelection = async () => {
  typeDialogVisible.value = false;
};
// 新增方法 - 全选/清空
const selectAllTypes = () => {
  selectedTypeIds.value = types.value.map(type => type.typeId);
};

const clearAllTypes = () => {
  selectedTypeIds.value = [];
};

// 一键检查功能（修正版）
// 修改quickCheck方法，添加selectedTypes参数
const quickCheck = async () => {
  analysisResult.value = '';
  if (!selectedFile.value) {
    showStatus('请先选择文件', 'error');
    return;
  }

  try {
    isQuickChecking.value = true;
    showStatus('正在一键检查文件...', 'info');
    
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    
    // 获取选中的promptIds
    const selectedPromptIds = selectedTypeIds.value.join(',');


    // 将typeIds作为参数发送
    formData.append('typeIds', selectedPromptIds);
    
    const response = await axios.post('https://hnqx.online/chat/chat/textCheck', formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // 处理响应...（保持原有逻辑不变）
    if (response.data instanceof Blob) {
      if (response.data.type.includes('application/json')) {
        const errorData = await parseBlobToJson(response.data);
        if (errorData.result) {
          analysisResult.value = errorData.result;
          showStatus('检查完成，发现问题', 'warning');
        } else {
          throw new Error(errorData.message || '检查失败');
        }
      } else {
        const fileName = getFileNameFromHeaders(response.headers, response.data);
        downloadFile(response.data, fileName);
        showStatus('检查结果文件已下载', 'success');
      }
    } else {
      handleNonBlobResponse(response.data);
    }
  } catch (error) {
    handleCheckError(error);
  } finally {
    isQuickChecking.value = false;
  }
};

// 修正后的辅助函数
const getFileNameFromHeaders = (headers, blob) => {
  const contentDisposition = headers['content-disposition'];
  let fileName = '检查结果_' + new Date().toISOString().slice(0, 10);
  
  if (contentDisposition) {
    const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (utf8FilenameMatch) {
      fileName = decodeURIComponent(utf8FilenameMatch[1]);
    } else {
      const filenameMatch = contentDisposition.match(/filename="?([^;"]+)"?/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }
    }
  }
  
  // 使用传入的blob参数判断文件类型
  if (!fileName.includes('.')) {
    fileName +=  '.docx' ;
  }
  
  return fileName;
};

// 辅助函数：下载文件
const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// 辅助函数：解析Blob为JSON
const parseBlobToJson = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (e) {
        reject(new Error('解析响应数据失败'));
      }
    };
    reader.onerror = () => reject(new Error('读取响应数据失败'));
    reader.readAsText(blob);
  });
};

// 辅助函数：处理非Blob响应
const handleNonBlobResponse = (data) => {
  if (!data) {
    throw new Error('未收到有效响应数据');
  }
  
  if (data.success === false) {
    if (data.result) {
      analysisResult.value = data.result;
      showStatus('检查完成，发现问题', 'warning');
    } else {
      throw new Error(data.message || '检查失败');
    }
  } else {
    analysisResult.value = data.result || '检查完成，未发现明显问题';
    showStatus('一键检查完成', 'success');
  }
};

// 辅助函数：处理错误
const handleCheckError = (error) => {
  let errorMessage = '一键检查失败';
  
  if (error.response) {
    // 服务器响应了错误状态码
    console.error('服务器错误:', error.response.status, error.response.data);
    
    if (error.response.data instanceof Blob) {
      // 如果是Blob类型的错误响应
      parseBlobToJson(error.response.data)
        .then(errorData => {
          showStatus(`${errorMessage}: ${errorData.message || '服务器错误'}`, 'error');
        })
        .catch(() => {
          showStatus(`${errorMessage}: 服务器返回了错误状态 ${error.response.status}`, 'error');
        });
      return;
    }
    
    errorMessage += `: ${error.response.data?.message || `服务器错误 ${error.response.status}`}`;
  } else if (error.request) {
    // 请求已发出但没有收到响应
    console.error('无响应:', error.request);
    errorMessage += ': 请求超时，请检查网络连接';
  } else {
    // 其他错误
    console.error('检查错误:', error.message);
    errorMessage += `: ${error.message}`;
  }
  
  showStatus(errorMessage, 'error');
};

// 获取类型列表
const fetchTypeList = async () => {
  try {
    const { data } = await getPromptType();
    types.value = data.data.map(item => ({
      ...item,
      typeId: Number(item.typeId),
      orderNumber: Number(item.orderNumber)
    }));
    
    // 如果有类型数据，默认选择第一个类型并获取对应的规则
    if (types.value.length > 0) {
      radio.value = types.value[0].typeId;
      await fetchAllPrompts(); // 一次性获取所有规则
    }
  } catch (error) {
    ElMessage.error('获取类型数据失败');
  }
};

// 一次性获取所有检查规则
const fetchAllPrompts = async () => {
  try {
    const { data } = await getPromptList();
    promptList.value = data.data;
    updateCurrentPromptContent();
  } catch (error) {
    ElMessage.error('获取检查规则失败');
  }
};

// 类型变更处理
const handleTypeChange = () => {
  if (radio.value !== 0) {
    updateCurrentPromptContent();
  }
};

// 更新当前显示的规则内容
const updateCurrentPromptContent = () => {
  if (radio.value === 0) return;
  
  const filteredData = promptList.value.filter(
    item => item.promptTypeId === radio.value
  );

  currentPromptContent.value = filteredData
    .map((item, index) => {
      const text = item.promptContent?.trim() || '';
      return text 
    })
    .filter(Boolean)
    .join('\n<br>');
};

// 文件选择处理
const handleFileSelect = async (event) => {
  resetStatus();
  const file = event.target.files[0];

  if (!validateFile(file)) return;
  selectedFile.value = file;
  showStatus('文件已选择，点击开始分析', 'info');
};

// 复制文本
const copyText = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    copiedUrlMessage.value = '已复制到剪贴板！';
    setTimeout(() => copiedUrlMessage.value = '', 2000);
  } catch (err) {
    console.error('无法复制文本：', err);
    copiedUrlMessage.value = '复制URL失败，请尝试再次点击。';
  }
};

// 导出Word文档
const exportToWord = async () => {
  try {
    isExporting.value = true;
    const doc = new Document({
      sections: [{
        properties: {},
        children: analysisResult.value.split('\n').map(line =>
          new Paragraph({
            children: [new TextRun({
              text: line.replace(/^#+\s*/, ''),
              bold: line.startsWith('#')
            })]
          })
        )
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `分析报告_${new Date().toLocaleDateString().replace(/\//g, '-')}.docx`);
  } catch (err) {
    console.error('导出失败:', err);
    ElMessage.error('文档生成失败，请重试');
  } finally {
    isExporting.value = false;
  }
};

// 文件验证
const validateFile = (file) => {
  if (!file) return false;

  const validTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!validTypes.includes(file.type)) {
    showStatus('错误：仅支持TXT/DOCX格式', 'error');
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    showStatus('错误：文件大小不能超过50MB', 'error');
    resetFileInput();
    return false;
  }

  return true;
};

// 主分析流程
const startAnalysis = async () => {
  try {
    initAnalysisProcess();
    const content = await readFileContent(selectedFile.value);
    const result = await analyzeContent(content);

    analysisResult.value = result;
    showStatus('分析完成', 'success');
  } catch (error) {
    handleAnalysisError(error);
  } finally {
    isProcessing.value = false;
  }
};

// 文件内容读取
const readFileContent = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        resolve(result.value);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
      }
    } catch (error) {
      reject(new Error('文件解析失败'));
    }
  });
};

// API分析请求
const analyzeContent = async (content) => {
  showStatus('正在分析文件...', 'info');
  analysisResult.value = '';

  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.value,
        messages: [
          { role: "system", content: "你是中文科技期刊的编辑，返回信息时简明扼要，段落分明，使用统一的字体大小。" },
          { 
            role: "user", 
            content: `分析以下文档内容：\n${activePromptContent.value}\n\n文档内容如下：\n${content}` 
          },
        ],
        temperature: 0,
        max_tokens: 5120,
        do_sample: false,
        stream: true,
        top_p: 1.0,
        top_k: 50,
        seed:123,       //固定随机种子
        frequency_penalty: 0.5
      }),
      signal: abortController.value.signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API请求失败');
    }

    return await processStream(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    throw new Error(`分析失败: ${error.message}`);
  }
};

// 流式处理
const processStream = async (response) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.choices[0].delta?.content) {
              result += data.choices[0].delta.content;
              analysisResult.value = result;
              await nextTick();
            }
          } catch (e) {
            console.warn('解析JSON失败:', e);
          }
        }
      }
    }
    return result;
  } finally {
    reader.releaseLock();
  }
};

// 重置
const resetAll = () => {
  selectedFile.value = null;
  analysisResult.value = '';
  resetStatus();
  resetFileInput();
  
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = new AbortController();
  }
};

// 错误处理
const handleAnalysisError = (error) => {
  showStatus(error.message, 'error');
  console.error('分析错误:', error);
  resetFileInput();
};

// 状态管理
const initAnalysisProcess = () => {
  isProcessing.value = true;
  analysisResult.value = '';
  abortController.value = new AbortController();
};

const resetFileInput = () => {
  fileInput.value.value = '';
  quickFileInput.value.value = '';
};

const showStatus = (message, type = 'info') => {
  status.message = message;
  status.type = type;
};

const resetStatus = () => {
  status.message = '';
  status.type = 'info';
};
</script>

<style scoped lang="scss">
@import url(../assets/styles/file.css);

/* 对话框样式优化 */
.type-select-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow: hidden;
    
    .el-dialog__header {
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
      padding-bottom: 10px;
      margin-right: 0;
    }
    
    .el-dialog__body {
      padding: 0 20px;
      flex: 1;
      overflow-y: auto;
    }
    
    .el-dialog__footer {
      position: sticky;
      bottom: 0;
      background: white;
      z-index: 10;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
  
  .select-actions {
    display: flex;
    gap: 15px;
    
    .el-button {
      padding: 0;
      height: auto;
    }
  }
  
  .selected-count {
    font-size: 13px;
    color: #666;
  }
}

.dialog-content {
  padding: 5px 0;
  max-height: calc(70vh - 150px);
  overflow-y: auto;
  
  .el-checkbox-group {
    display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
  }
  
  .type-checkbox {
    display: grid;
      grid-template-columns: auto 1fr;
      align-items: start; /* 顶部对齐 */
      width: 100%;
      height: auto;
      margin: 0 !important;
      min-height: auto !important; /* 移除最小高度限制 */
    
    :deep(.el-checkbox__label) {
      display: inline-block;
        white-space: normal;
        word-break: break-word;
        text-align: left;
        line-height: 1.5;
        padding-left: 8px;
        width: 100%;
    }
    
    .type-name {
      font-weight: 500;
        color: #333;
        display: block;
        width: 100%;
        /* 确保高度自适应 */
        height: auto;
        min-height: 0;
    }
    
    .type-desc {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0;
}


.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 80px;
}

.upload-section {
  margin-bottom: 20px;
  
  input[type="file"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
    
    .reset-file-btn {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #999;
      
      &:hover {
        color: #666;
      }
    }
  }
}

.check-options {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .check-option {
    flex: 1;
    padding: 15px;
    border-radius: 8px;
    background-color: #ffffff;
    
    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
      font-size: 16px;
    }
    
    .option-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    &.type-based {
      border-left: 4px solid #409eff;
    }
    
    &.quick-check {
      border-left: 4px solid #67c23a;
    }
  }
}

.check-btn {
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  text-align: center;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &.quick-check-btn {
    background-color: #67c23a;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #85ce61;
    }
    
    &:disabled {
      background-color: #b3e19d;
    }
  }
  
  &:not(.quick-check-btn) {
    background-color: #409eff;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #66b1ff;
    }
    
    &:disabled {
      background-color: #a0cfff;
    }
  }
}



.check-methods {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .method-section {
    flex: 1;
    padding: 20px;
    border-radius: 8px;
    background-color: #f8f9fa;
    
    h2 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
      font-size: 18px;
    }
    
    &.type-based {
      border-left: 4px solid #409eff;
    }
    
    &.quick-check {
      border-left: 4px solid #67c23a;
    }
  }
}


.file-type-tips {
  margin: 15px 0;
  color: #666;
  font-size: 14px;
  background-color: #eceef0;
  padding: 15px;
  border-radius: 8px;
  
  ul {
    padding-left: 20px;
    margin: 5px 0;
  }
}

.status {
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  
  &.info {
    background-color: #f4f4f5;
    color: #909399;
  }
  
  &.success {
    background-color: #e9f7e2;
    color: #67c23a;
  }
  
  &.error {
    background-color: #fef0f0;
    color: #f56c6c;
  }
  
  .loader {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0,0,0,0.2);
    border-radius: 50%;
    border-top-color: rgba(0,0,0,0.6);
    animation: spin 1s linear infinite;
    margin-right: 5px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  margin-top: 30px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
  
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    h2 {
      margin: 0;
      color: #303133;
    }
  }
  
  .result-content {
    padding: 15px;
    background-color: #fafafa;
    border-radius: 4px;
    min-height: 200px;
    line-height: 1.6;
  }
  
  .reset-btn {
    margin-top: 15px;
    padding: 8px 16px;
    background-color: #f56c6c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: #f78989;
    }
  }
}

.copied-message {
  color: #67c23a;
  font-size: 14px;
  margin: 5px 0;
}
.input {
  width: 100%;
  max-height: 280px;
  overflow: auto;
  position: relative;
  display: inline-block;
  letter-spacing: 2px;
  border: 0;
  border-radius: 1px;
  display: inline-block;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 4px 20px;
  color: #555555;
  cursor: pointer;
  background: #fff;
  font-size: 14px;
}

.history-control {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
}

.model-select {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .check-methods {
    flex-direction: column;
  }
}
</style>