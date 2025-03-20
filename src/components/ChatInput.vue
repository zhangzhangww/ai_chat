<template>
    <div class="chat-input">
      <div class="input-container">
        <textarea
          ref="textareaRef"
          v-model="input"
          :disabled="loading"
          @keydown.enter.exact.prevent="handleSubmit"
          @input="adjustHeight"
        />
        <button 
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ loading ? '发送中...' : '发送' }}
        </button>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, nextTick } from 'vue'
  
  const props = defineProps<{
    modelValue: string
    loading: boolean
    error?: string
  }>()
  
  const emit = defineEmits(['update:modelValue', 'submit'])
  
  const textareaRef = ref<HTMLTextAreaElement>()
  const input = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })
  
  const canSubmit = computed(() => 
    !props.loading && input.value.trim().length > 0
  )
  
  const adjustHeight = () => {
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
      }
    })
  }
  
  const handleSubmit = () => {
    if (canSubmit.value) {
      emit('submit')
    }
  }
  </script>