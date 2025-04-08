<template>
  <div class="ai_content">
    <!-- 清空消息 -->
    <div class="history-control">

      <span> 模型：
        <select v-model="model" class="model-select">
          <option v-for="opt in options" :value="opt.value">{{ opt.text }}</option>
        </select>
      </span>
      <button class="clear-btn" @click="handleClearHistory">清空记录</button>
    </div>

    <!-- 内容显示区 -->
    <div class="message" id='message-box'>
      <div class="role-content" id="role-content">
        <div v-for="(msg, index) in msgList" :key="index" :class="{
          'user': msg.role === 'user',
          'assistant': msg.role === 'assistant'
        }">
          <!-- 提问 -->
          <img v-if="msg.role === 'user'" class='role-img' style="margin-left: 8px;" src="@/assets/images/bac1.png" />
          <!-- ai回答 -->
          <img v-if="msg.role === 'assistant'" class='role-img' src="@/assets/images/aiIcon.png"
            style="margin-right: 8px;" />
          <div>
            <div class="content-html ass1" v-if="msg.role === 'assistant'" v-html="msg.reasoning_content">
            </div>
            <div class="content-html" :class="msg.role === 'assistant' ? 'ass' : 'us'" v-highlight
              v-html="markdownToHtml(msg.content)">
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 底部问题发送区域 -->
    <div class="footer">
      <textarea rows="5" placeholder="请输入问题" class="text" v-model="msgValue"></textarea>
      <button class="btn" @click="submitMsg">发送</button>
    </div>
  </div>

</template>

<script setup>
import { nextTick, onMounted, ref, onUnmounted } from 'vue'
import { userMsgStore } from '@/stores/msgStore'
import { marked } from 'marked';  // ✅ 使用命名导出

const msgStore = userMsgStore()
const aichat = ref(false)
const msgValue = ref("")
const model = ref("deepseek-ai/DeepSeek-R1-Distill-Qwen-7B")
const isloading = ref(false)
const msgDom = ref(null)
let controller = new AbortController()


const options = ref([
  { value: 'Qwen/QwQ-32B', text: 'Qwen/QwQ-32B' },
  { value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', text: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B' },
  { value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', text: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B' },
  { value: 'deepseek-ai/DeepSeek-R1', text: 'deepseek-ai/DeepSeek-R1' },
  { value: 'deepseek-ai/DeepSeek-V3', text: 'deepseek-ai/DeepSeek-V3' },
])

const msgList = ref([...msgStore.list])

onMounted(() => {
  msgDom.value = document.getElementById("role-content")
  marked.setOptions({
    highlight: code => hljs.highlightAuto(code).value,
    sanitize: true // 增加HTML消毒
  });
  scroll()
})

onUnmounted(() => {
  controller.abort()
})

// Markdown 转 HTML（带代码高亮）
const markdownToHtml = (content) => {
  return marked(content);
}


const scroll = () => {
  nextTick(() => {
    if (!msgDom.value) return
    // 确保内容加载完成
    setTimeout(() => {
      msgDom.value.scrollTo({
        top: msgDom.value.scrollHeight,
        behavior: 'smooth'
      })
    }, 0)
  })
}

//清空历史消息
const handleClearHistory = () => {
  if (confirm('确定要清空所有聊天记录吗？')) {
    msgStore.clearMessages();
    msgList.value = [];
  }
}

const goChat = () => {
  aichat.value = !aichat.value
  document.body.style.overflow = aichat.value ? 'hidden' : 'auto'
  scroll()
}

const isSubmitting = ref(false)
const submitMsg = async () => {
  if (!msgValue.value.trim()) return
  //防止重复提交
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    isloading.value = true
    controller = new AbortController()

    // 添加用户消息
    msgStore.userAddMsg(msgValue.value)
    msgList.value = [...msgStore.list]

    // 添加初始助手消息
    msgStore.addAssistantMessage('', '')
    msgList.value = msgStore.list

    // 构造上下文消息
    const contextMessages = msgStore.formattedContext

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.value,
        stream: true,
        // max_tokens: 512,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        messages: [ // 系统提示词（可选）
          { role: "system", content: "请根据对话历史提供专业准确的回答" },
          ...contextMessages,
          { role: "user", content: msgValue.value }
        ]
      }),
      signal: controller.signal
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 处理完整的数据块
      const chunks = buffer.split('data: ')
      buffer = chunks.pop() || ''

      for (const chunk of chunks) {
        const trimmedChunk = chunk.trim()
        if (!trimmedChunk) continue

        try {
          const data = JSON.parse(trimmedChunk)
          const delta = data.choices[0].delta

          // 更新最后一条消息
          const lastMsg = msgList.value[msgList.value.length - 1]
          if (lastMsg.role === 'assistant') {
            lastMsg.content += delta.content || ''
            lastMsg.reasoning_content += delta.reasoning_content || ''

            // 同步到 store
            // msgStore.aiAddContent(lastMsg)
            msgList.value = [...msgStore.list]
            scroll()

          }
        } catch (e) {
          console.error('解析错误:', e)
        }
      }
    }

  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('请求失败:', error)
    }
  } finally {
    isloading.value = false
    msgValue.value = ""
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
p {
  margin: 0;
  padding: 0;
}

#role-content {
  height: 100%;
  overflow-y: auto;
  /* 或者 overflow-y: scroll */
  /* 其他需要的样式 */
}

.ass {
  padding: 12px 24px;
  border-radius: 8px;
  white-space: normal;
  background-color: #ffffff;
  font-size: 16px;
}

.us {
  float: right;
  background: #ffffff;
  color: #333333;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-size: 16px;
}

.ass1 {
  margin-bottom: 12px;
  position: relative;
  font-size: 16px;
  padding-left: 16px;
  color: #8b8b8b;
  line-height: 26px;
  height: 100%;
  white-space: pre-wrap;

  // 文字前面加个丨
  &::before {
    content: '';
    position: absolute;
    margin-top: 8px;
    left: 0;
    width: 2px;
    height: calc(100% - 16px);
    background-color: #d1d1d1;
    display: inline-block;

  }
}

.ai_content {
  margin: auto;
  padding-bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 60%;
  min-width: 800px;

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

  .clear-btn {
    padding: 6px 12px;
    background-color: #ff4d4f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .clear-btn:hover {
    background-color: #ff7875;
  }

  .model-select {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;

  }

  .message {
    position: relative;
    width: 100%;
    height: 76%;
    margin: 20px 0 20px;
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius);
    box-sizing: border-box;
    overflow: auto;



    .user {
      padding: 12px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      // 从右向左排列
      flex-direction: row-reverse;
    }

    .role-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }

    .assistant {
      padding: 12px;
      box-sizing: border-box;
      display: flex;
      align-items: self-start;

      img {
        min-width: 40px;
        height: 40px;

      }
    }
  }


  .footer {
    position: relative;
    margin: auto;
    width: 100%;


    .text {
      height: 100px;
      width: 100%;
      padding: 20px;
      border: #ccc solid 1px;
      border-radius: var(--border-radius);
      white-space: pre-wrap;
    }

    .btn {
      position: absolute;
      top: 32%;
      right: 3%;
      width: 100px;
      height: 40px;
      background: linear-gradient(78deg, #6740FD 0%, #4495F9 99%);
      color: white;
    }


  }
}

</style>
