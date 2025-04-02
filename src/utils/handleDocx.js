// utils/handleDocx.js
import * as mammoth from 'mammoth';
import { Document, Paragraph, Packer, TextRun } from "docx";
import { saveAs } from 'file-saver';

// 文件类型白名单
const ALLOWED_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const readFileContent = async (file) => {
  try {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return result.value;
    }
    
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  } catch (error) {
    throw new Error('文件解析失败');
  }
};

export const exportToDocx = async (content, fileName = 'document') => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: content.split('\n').map(line =>
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
    saveAs(blob, `${fileName.replace(/\.docx$/, '')}.docx`);
    return true;
  } catch (err) {
    throw new Error('文档生成失败');
  }
};

export const validateFileType = (file) => {
  if (!file) return false;
  return ALLOWED_TYPES.includes(file.type);
};