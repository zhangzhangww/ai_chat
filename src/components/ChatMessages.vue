<template>
    <div 
      id="message-container"
      class="message-container"
    >
      <TransitionGroup name="message-fade">
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </TransitionGroup>
    </div>
  </template>
  
  <script setup lang="ts">
  import MessageBubble from './MessageBubble.vue'
  
  defineProps<{
    messages: ChatMessage[]
  }>()
  </script>
  