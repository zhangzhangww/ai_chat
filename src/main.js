import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import hljs from 'highlight.js'
import "highlight.js/styles/atom-one-dark.css"
import PiniaPluginPersistedstate from "pinia-plugin-persistedstate"
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app=createApp(App)

// 配置Pinia并设置持久化缓存
const pinia = createPinia()
pinia.use(PiniaPluginPersistedstate)

// 配置Markdown语法高亮

app.directive('highlight', {
  mounted(el) {
    highlightElement(el)
  },
  updated(el) {
    resetHighlight(el)
    highlightElement(el)
  }
})

// 高亮清理函数
function resetHighlight(el) {
  const blocks = el.querySelectorAll('pre code')
  blocks.forEach(block => {
    // 移除高亮标记和样式
    delete block.dataset.highlighted
    block.classList.remove('hljs')
    // 恢复原始代码内容
    if (block.__originalHTML) {
      block.innerHTML = block.__originalHTML
    }
  })
}

// 安全高亮函数
function highlightElement(el) {
  nextTick(() => {
    const blocks = el.querySelectorAll('pre code')
    blocks.forEach(block => {
      try {
        // 保存原始内容
        block.__originalHTML = block.innerHTML
        // 使用新版API
        hljs.highlightElement(block, {
          ignoreUnescapedHTML: true // 安全选项
        })
      } catch (error) {
        console.warn('代码高亮失败:', error)
        // 回退显示原始代码
        block.textContent = block.__originalHTML || block.textContent
      }
    })
  })
}




  app.use(pinia)
  app.use(ElementPlus)

app.use(router)
app.mount('#app')
