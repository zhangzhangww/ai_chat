<template>
  <div class="not-found-container">
    <div class="error-content">
      <div class="error-image">
        <!-- 使用搜索图标表示404 -->
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">页面未找到</h2>
      <p class="error-message">抱歉，您访问的页面不存在或已被移除。</p>
      <div class="action-buttons">
        <router-link to="/" class="home-button">返回首页</router-link>
        <button @click="goBack" class="back-button">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found-container {
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-image {
  margin-bottom: 20px;
}

.error-image svg {
  color: #17a2b8; /* 更改为蓝色系 */
}

.error-title {
  font-size: 5rem;
  margin: 0;
  color: #17a2b8; /* 更改为蓝色系 */
}

.error-subtitle {
  font-size: 1.5rem;
  margin: 10px 0;
  color: #343a40;
}

.error-message {
  font-size: 1.1rem;
  color: #6c757d;
  margin-bottom: 30px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.home-button, .back-button {
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.home-button {
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border: none;
}

.home-button:hover {
  background-color: #0069d9;
}

.back-button {
  background-color: white;
  color: #495057;
  border: 1px solid #dee2e6;
}

.back-button:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}
</style>