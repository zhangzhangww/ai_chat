<template>
  <div class="container">
    <h1 style="font-size: 32px;">气象科技期刊全文智能编校系统（v1.0）</h1>

    <div class="upload-section">
      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".txt,.docx" :disabled="isProcessing" />
      <button @click="startAnalysis" :disabled="!selectedFile || isProcessing">
        {{ buttonText }}
      </button>
    </div>
    <el-select v-model="radio" style="width: 160px;margin-bottom: 12px;" @change="handleTypeChange">
      <el-option label="自定义检查" :value="0" />
      <el-option v-for="item in types" :key="item.typeId" :label="item.typeName" :value="item.typeId" />
    </el-select>
    <div class="input-section">
      <input v-if="radio == 0" class="input" type="text" v-model="customPrompt" placeholder="请输入检查规则">
      <div v-if="radio !== 0" class="input" v-html="markdownToHtml(currentPromptContent)">
      </div>
    </div>

    <div class="file-type-tips">
      <ul>
        <li>（1）选择上传需要修改的文件</li>
        <li>（2）选择需要检查的类型，可以在知识库管理处进行配置</li>
        <li>（3）选择开始编校</li>
      </ul>
    </div>

    <div v-if="status.message" :class="['status', status.type]">
      <span v-if="isProcessing" class="loader"></span>
      {{ status.message }}
    </div>
    <!-- 复制成功提示 -->
    <p v-if="copiedUrlMessage" class="copied-message">{{ copiedUrlMessage }}</p>
    <!-- 分析结果： -->
    <div v-if="analysisResult" class="result-section">
      <div class="title">
        <h2>分析结果</h2>
        <div class="Function">
          <span @click="copyText(analysisResult)">复制内容</span>
          <button @click="exportToWord" class="export-btn">
            {{ isExporting ? '生成中...' : '生成Word文档' }}
          </button>
        </div>
      </div>
      <div class="result-content" v-html="markdownToHtml(analysisResult)"></div>
      <button @click="resetAll" class="reset-btn">新的分析</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue';
import { marked } from 'marked';
import * as mammoth from 'mammoth';
import { Document, Paragraph, Packer, TextRun } from "docx";
import { saveAs } from 'file-saver';
import { getPromptList } from '../api/aiChat'
import { getPromptType } from '../api/promptType'
import { ElMessage } from 'element-plus';

// 响应式变量
const selectedFile = ref(null);
const analysisResult = ref('');
const isProcessing = ref(false);
const isExporting = ref(false);
const copiedUrlMessage = ref('');
const fileInput = ref(null);
const abortController = ref(new AbortController());

// 检查规则相关
const radio = ref(0); // 默认选择自定义检查
const types = ref([]);
const promptList = ref([]); // 存储所有检查规则
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
         selectedFile.value ? '开始编校' : '选择文件';
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

// 方法
const markdownToHtml = (content) => {
  return marked(content || '');
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
      return text ? `${index + 1}. ${text}     ` : '';
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
  if (file.size > 2 * 1024 * 1024) {
    showStatus('错误：文件大小不能超过20MB', 'error');
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
          { role: "system", content: "你是《气象与环境科学》的编辑" },
          { 
            role: "user", 
            content: `分析以下文档内容，并指出错误在文章对应位置：\n${activePromptContent.value}\n\n文档内容如下：\n${content}` 
          },
        ],
        temperature: 0.2,
        stream: true,
        top_p: 0.7,
        top_k: 50,
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
</style>