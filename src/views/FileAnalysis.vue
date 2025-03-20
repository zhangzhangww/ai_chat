<template>
  <div class="container">
    <h1>智能文件分析系统</h1>

    <div class="upload-section">
      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".txt,.docx" :disabled="isProcessing" />
      <button @click="startAnalysis" :disabled="!selectedFile || isProcessing">
        {{ buttonText }}
      </button>
    </div>
    <div class="input-section">
      <input type="text" v-model="needAbort" placeholder="请输入需要分析的内容">
    </div>

    <div class="file-type-tips">
      <p>支持文件类型：</p>
      <ul>
        <li>📝 TXT文本文件（UTF-8编码）</li>
        <li>📑 Word文档（.docx格式）</li>
      </ul>
      <p>最大文件尺寸：2MB</p>
    </div>

    <div v-if="status.message" :class="['status', status.type]">
      <span v-if="isProcessing" class="loader"></span>
      {{ status.message }}
    </div>

    <div v-if="analysisResult" class="result-section">
      <h2>分析结果</h2>
      <div class="result-content" v-html="markdownToHtml(analysisResult)"></div>
      <button @click="resetAll" class="reset-btn">新的分析</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { marked } from 'marked';  // ✅ 使用命名导出
import * as mammoth from 'mammoth'; // 新增DOCX解析库

const selectedFile = ref(null);
const analysisResult = ref('');
const isProcessing = ref(false);
const fileInput = ref(null);
const abortController = ref(new AbortController());
const needAbort = ref("请按以下格式输出：\n1. 文章错别字查找，并标记处相应位置\n2. 文章语句优化，并标注相应位置\n3. 调整优化建议");
// const model = ref('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B');
const model = ref('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B');

const status = reactive({
  message: '',
  type: 'info' // info | error | success
});

onMounted(() => {
  marked.setOptions({
    highlight: code => hljs.highlightAuto(code).value,
    sanitize: true // 增加HTML消毒
  });
})
// Markdown 转 HTML（带代码高亮）
const markdownToHtml = (content) => {
  return marked(content);
}


// 计算属性
const buttonText = computed(() => {
  if (isProcessing.value) return '分析中...';
  return selectedFile.value ? '开始分析' : '选择文件';
});

// 文件选择处理
const handleFileSelect = async (event) => {
  resetStatus();
  const file = event.target.files[0];

  if (!validateFile(file)) return;
  selectedFile.value = file;
  showStatus('文件已选择，点击开始分析', 'info');
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
    showStatus('错误：文件大小不能超过2MB', 'error');
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



// 文件内容读取方法
const readFileContent = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      
       if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        
        // DOCX解析逻辑
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        resolve(result.value);
      } else {
        // 原有TXT处理逻辑
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      }
    } catch (error) {
      reject(new Error('文件解析失败'));
    }
  });
};

// API分析请求
const analyzeContent = async (content) => {
  showStatus('正在分析内容...', 'info');

  // const analysisText = content.length > 3000 
  //   ? `${content.slice(0, 3000)}... [内容已截断]`
  //   : content;
  const analysisText = content;
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.value,
        messages: [{
          role: "user",
          content: `请分析以下文档内容：\n${analysisText}\n${needAbort.value}`
        }],
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1
      }),
      signal: abortController.value.signal
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API请求失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    throw new Error(`分析失败: ${error.message}`);
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

const resetAll = () => {
  selectedFile.value = null;
  analysisResult.value = '';
  resetStatus();
  resetFileInput();
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

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 20px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #F6F6F6;
}

.upload-section {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  align-items: center;
}

input[type="file"] {
  padding: 0.8rem;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background: #f8fafc;
  transition: border-color 0.3s;
}
input[type="text"] {
  padding: 0.8rem;
  border: 1px solid #cacaca;
  border-radius: 8px;
  background: #f8fafc;
  transition: border-color 0.3s;
}

input[type="file"]:hover {
  border-color: #2563eb;
}

button {
  padding: 0.8rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.3s,
    transform 0.1s;
}

button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.status {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status.info {
  background: #e0f2fe;
  color: #0369a1;
}

.status.error {
  background: #fee2e2;
  color: #dc2626;
}

.status.success {
  background: #dcfce7;
  color: #16a34a;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.result-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-content {
  /* white-space: pre-wrap; */
  line-height: 1.6;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.reset-btn {
  background: #10b981;
  margin-top: 1rem;
}

.reset-btn:hover {
  background: #059669;
}




.file-type-tips {
  margin: 0;
  padding: 0.6rem;
  border-radius: 8px;
  color: #666;
}

.file-type-tips ul {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.file-type-tips li {
  margin: 0.3rem 0;
}
</style>