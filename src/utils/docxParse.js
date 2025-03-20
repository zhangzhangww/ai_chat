 const parseDocx = async (file) => {
    try {
      const result = await mammoth.extractRawText({ 
        arrayBuffer: await file.arrayBuffer() 
      });
      
      // 处理文档样式信息
      const formattedText = result.value
        .replace(/\n{3,}/g, '\n\n')  // 压缩多余空行
        .replace(/\t/g, '    ')      // 转换制表符
        .replace(/\x0C/g, '\n');     // 转换分页符
  
      // 提取标题结构
      const headings = result.messages
        .filter(m => m.type === 'heading')
        .map(h => `#${h.level} ${h.text}`);
  
      return {
        text: formattedText,
        meta: {
          headings,
          pageCount: result.messages.filter(m => m.type === 'page-break').length + 1
        }
      };
    } catch (error) {
      throw new Error('DOCX解析失败: ' + error.message);
    }
  };

  export default parseDocx;