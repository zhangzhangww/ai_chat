<template>
  <div class="container">

    <h1 style="font-size: 40px;">《气象与环境科学》智慧编校系统</h1>

    <div class="upload-section">
      <input type="file" ref="fileInput" @change="handleFileSelect" accept=".txt,.docx" :disabled="isProcessing" />
      <button @click="startAnalysis" :disabled="!selectedFile || isProcessing">
        {{ buttonText }}
      </button>
    </div>
    <el-radio-group v-model="radio">
      <el-radio :value="0">全部检查</el-radio>
      <el-radio :value="2">格式检查</el-radio>
      <el-radio :value="1">语法检查</el-radio>
      <el-radio :value="3">自定义检查</el-radio>
    </el-radio-group>
    <div class="input-section">
      <input type="text" v-if="radio == 0" v-model="promptId" placeholder="请输入需要分析的内容">
      <input type="text" v-if="radio == 1" v-model="promptId1" placeholder="请输入需要分析的内容">
      <input type="text" v-if="radio == 2" v-model="promptId2" placeholder="请输入需要分析的内容">
      <input type="text" v-if="radio == 3" v-model="needAbort1" placeholder="请输入需要分析的内容">
    </div>

    <div class="file-type-tips">

      <ul>
        <li>（1）选择上传需要修改的文件</li>
        <li>（2）选择需要检查的类型，可以在提示词管理处进行配置</li>
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
import { ref, computed, reactive } from 'vue';
import { marked } from 'marked';  // ✅ 使用命名导出
import * as mammoth from 'mammoth'; // 新增DOCX解析库
import { Document, Paragraph, Packer, TextRun } from "docx";
import { saveAs } from 'file-saver';
import {
  getPromptList,
} from '../api/aiChat'

const selectedFile = ref(null);
const analysisResult = ref('');
const isProcessing = ref(false);
const isExporting = ref(false);
// 用于存储复制成功后的消息
const copiedUrlMessage = ref('');
const fileInput = ref(null);
const abortController = ref(new AbortController());
const needAbort1 = ref("");

//全部检查
const promptId = ref('');
//语法检查
const promptId1 = ref('');
//格式检查
const promptId2 = ref('');
//单选
const radio = ref(0);
// const model = ref('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B');
const model = ref('deepseek-ai/DeepSeek-V3');


const status = reactive({
  message: '',
  type: 'info' // info | error | success
});

onMounted(() => {
  marked.setOptions({
    highlight: code => hljs.highlightAuto(code).value,
    sanitize: true // 增加HTML消毒
  });
  fetchPromptList()
})
// Markdown 转 HTML（带代码高亮）
const markdownToHtml = (content) => {
  return marked(content);
}

// 获取数据列表
const fetchPromptList = async () => {
  try {
    const { data } = await getPromptList()
    // tableData.value = data.data
    // 处理数据并按 promptId 拼接 promptContent
    // 初始化每组序号计数器
    let count = 0,count1 = 0, count2 = 0;

    data.data.forEach(item => {
      count++;
      const id = item.promptType;
      const content = item.promptContent || ''; // 处理可能的空值
      promptId.value += `${count}.${content}\n   `; // 添加序号并换行
      if (id == 1) {
        count1++;
        promptId1.value += `${count1}.${content}\n   `; // 添加序号并换行
      } else if (id == 2) {
        count2++;
        promptId2.value += `${count2}.${content}\n    `; // 添加序号并换行
      }
    });


  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}



// 计算属性
const buttonText = computed(() => {
  if (isProcessing.value) return '分析中...';
  return selectedFile.value ? '开始编校' : '选择文件';
});

// 文件选择处理
const handleFileSelect = async (event) => {
  resetStatus();
  const file = event.target.files[0];

  if (!validateFile(file)) return;
  selectedFile.value = file;
  showStatus('文件已选择，点击开始分析', 'info');
};

// 复制文本


// 复制文本的函数
const copyText = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    copiedUrlMessage.value = '已复制到剪贴板！';

    // 可选：在一段时间后隐藏复制成功的提示信息
    setTimeout(() => {
      copiedUrlMessage.value = '';
    }, 2000); // 2秒后隐藏
  } catch (err) {
    console.error('无法复制文本：', err);
    copiedUrlMessage.value = '复制URL失败，请尝试再次点击。';
  }
};


// 导出Word文档
const exportToWord = async () => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: analysisResult.value.split('\n').map(line =>
          new Paragraph({
            children: [new TextRun({
              text: line.replace(/^#+\s*/, ''), // 移除Markdown标题
              bold: line.startsWith('#') // 标题加粗
            })]
          })
        )
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `分析报告_${new Date().toLocaleDateString().replace(/\//g, '-')}.docx`);
  } catch (err) {
    console.error('导出失败:', err);
    alert('文档生成失败，请重试');
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
// 新增响应式变量
const buffer = ref('');
const pending = ref('');
const resultContainer = ref(null);

// 修改后的分析内容处理逻辑
const analyzeContent = async (content) => {
  showStatus('正在分析文件...', 'info');
  buffer.value = '';
  pending.value = '';
  analysisResult.value = '';

  try {
    const needAbort = radio.value === 1 ? promptId1.value : 
                     radio.value === 2 ? promptId2.value : 
                     radio.value === 3 ? needAbort1.value : 
                     promptId.value;

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
          content: `分析以下文档内容，并指出错误在文章对应位置：\n${needAbort}\n文档内容如下：\n${content}`
        }],
        temperature: 0.7,
        stream: true, // 启用流式传输
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

    const reader = response.body.getReader();
    await processStream(reader);
    return buffer.value;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消');
    }
    throw new Error(`分析失败: ${error.message}`);
  }
};

// 新增流式处理逻辑
const processStream = async (reader) => {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      pending.value += chunk;

      // 处理完整的事件流消息
      while (pending.value.includes('\n')) {
        const lineEndIndex = pending.value.indexOf('\n');
        const line = pending.value.slice(0, lineEndIndex).trim();
        pending.value = pending.value.slice(lineEndIndex + 1);

        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            
            const data = JSON.parse(dataStr);
            if (data.choices[0].delta?.content) {
              buffer.value += data.choices[0].delta.content;
              analysisResult.value = buffer.value;
              
              // 自动滚动到底部
              await nextTick();
              if (resultContainer.value) {
                resultContainer.value.scrollTop = resultContainer.value.scrollHeight;
              }
            }
          } catch (e) {
            console.warn('解析JSON失败:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

// 修改后的重置逻辑
const resetAll = () => {
  selectedFile.value = null;
  analysisResult.value = '';
  buffer.value = '';
  pending.value = '';
  resetStatus();
  resetFileInput();
  
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = new AbortController();
  }
};

// 新增watch保持内容同步
watch(analysisResult, () => {
  // 保持原始功能：当结果更新时自动转换markdown
  markdownToHtml(analysisResult.value);
});


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

// const resetAll = () => {
//   selectedFile.value = null;
//   analysisResult.value = '';
//   resetStatus();
//   resetFileInput();
// };

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
@import url(../assets/styles/file.css);

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