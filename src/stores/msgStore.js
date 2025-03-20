import { defineStore } from 'pinia'
import { marked } from 'marked'

export const userMsgStore = defineStore("userMsgStore", {
  persist: true,
  state: () => ({
    list: [{
      role: "assistant",
      content: "你好！很高兴见到你。有什么我可以帮助你的吗？如果你有任何问题，请随时告诉我。我会尽力提供帮助。",
      reasoning_content: "",
      status: 1 // 1-生成中 2-完成
    }],
    maxContextLength: 6 // 保留最近3组对话（6条消息）
  }),
  //增加上下文联想功能
  getters: {
    formattedContext: (state) => {
      return state.list
        .slice(-state.maxContextLength)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
    }
  },
  actions: {
    // 添加用户消息
    userAddMsg(msg) {
      this.list.push({
        role: "user",
        content: msg,
        reasoning_content: "", // 保持一致结构
        status: 2
      })
    },
    //清空消息
    clearMessages() {
      this.list = [{
        role: "assistant",
        content: "你好！很高兴见到你。有什么我可以帮助你的吗？如果你有任何问题，请随时告诉我。我会尽力提供帮助。",
        reasoning_content: "",
        status: 1 // 1-生成中 2-完成
      }];
      
    },

    // 添加初始AI消息（新增方法）
    addAssistantMessage() {
      this.list.push({
        role: "assistant",
        content: "",
        reasoning_content: "",
        status: 1 // 1-生成中 2-完成
      })
    },

    // 更新AI消息内容（支持双内容更新）
    aiAddContent({ content, reasoning_content }) {
      const lastMsg = this.list[this.list.length - 1]
      if (!lastMsg || lastMsg.role !== "assistant") return

      lastMsg.content += content || ""
      lastMsg.reasoning_content += reasoning_content || ""
    },

    // 完成AI消息（新增方法）
    completeAiMessage() {
      const lastMsg = this.list[this.list.length - 1]
      if (!lastMsg || lastMsg.role !== "assistant") return

      lastMsg.status = 2
      console.log(lastMsg.content)
      lastMsg.content = marked(lastMsg.content) // 仅转换content
      console.log(lastMsg.content)
    },

    // 清理进行中的消息（新增方法）
    clearPendingMessages() {
      this.list = this.list.filter(msg => msg.status === 2)
    }
  }
})