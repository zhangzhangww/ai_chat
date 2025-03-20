import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
  createdAt: number
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    error: null as string | null,
    activeStream: null as AbortController | null
  }),
  actions: {
    addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>) {
      const newMessage = {
        ...message,
        id: nanoid(),
        createdAt: Date.now()
      }
      this.messages.push(newMessage)
      return newMessage
    },
    updateMessage(id: string, updates: Partial<ChatMessage>) {
      const index = this.messages.findIndex(m => m.id === id)
      if (index >= 0) {
        this.messages[index] = { ...this.messages[index], ...updates }
      }
    },
    abortStream() {
      this.activeStream?.abort()
      this.activeStream = null
    },
    setError(error: string | null) {
      this.error = error
    }
  },
  getters: {
    getMessages: (state) => state.messages,
    hasError: (state) => state.error !== null
  }
})