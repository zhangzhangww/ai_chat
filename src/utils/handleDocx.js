import * as mammoth from 'mammoth'; // 新增DOCX解析库

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
  export default {
    handleFileSelect,
    startAnalysis,
    readFileContent
  }