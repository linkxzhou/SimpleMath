<script setup lang="ts">
import { computed } from 'vue'
import { User, Bot, Play, Copy, Check } from 'lucide-vue-next'
import { ref } from 'vue'
import type { Message } from '@/stores/conversation'

interface Props {
  message: Message
}

interface Emits {
  (e: 'run-code', code: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const copied = ref(false)

// 计算属性
const isUser = computed(() => props.message.role === 'user')
const hasCode = computed(() => !!props.message.generatedCode)

// 格式化时间
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 复制代码
const copyCode = async () => {
  if (!props.message.generatedCode) return
  
  try {
    await navigator.clipboard.writeText(props.message.generatedCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

// 运行代码
const runCode = () => {
  if (props.message.generatedCode) {
    emit('run-code', props.message.generatedCode)
  }
}

// 格式化消息内容（处理换行）
const formatContent = (content: string) => {
  return content.replace(/\n/g, '<br>')
}
</script>

<template>
  <div class="flex space-x-3" :class="{ 'flex-row-reverse space-x-reverse': isUser }">
    <!-- 头像 -->
    <div 
      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
      :class="isUser ? 'bg-blue-600' : 'bg-gray-600'"
    >
      <User v-if="isUser" class="w-4 h-4 text-white" />
      <Bot v-else class="w-4 h-4 text-white" />
    </div>
    
    <!-- 消息内容 -->
    <div class="flex-1 max-w-[80%]">
      <!-- 消息气泡 -->
      <div 
        class="px-4 py-3 rounded-lg"
        :class="isUser 
          ? 'bg-blue-600 text-white ml-auto' 
          : 'bg-gray-100 text-gray-800'"
      >
        <div 
          class="text-sm leading-relaxed"
          v-html="formatContent(message.content)"
        ></div>
      </div>
      
      <!-- 生成的代码 -->
      <div v-if="hasCode" class="mt-3 border border-gray-200 rounded-lg overflow-hidden">
        <!-- 代码头部 -->
        <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">生成的p5.js代码</span>
          <div class="flex items-center space-x-2">
            <button
              @click="copyCode"
              class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              :title="copied ? '已复制' : '复制代码'"
            >
              <Check v-if="copied" class="w-4 h-4 text-green-600" />
              <Copy v-else class="w-4 h-4" />
            </button>
            
            <button
              @click="runCode"
              class="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              title="运行代码"
            >
              <Play class="w-3 h-3" />
              <span>运行</span>
            </button>
          </div>
        </div>
        
        <!-- 代码内容 -->
        <div class="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
          <pre class="text-sm font-mono leading-relaxed"><code>{{ message.generatedCode }}</code></pre>
        </div>
      </div>
      
      <!-- 时间戳 -->
      <div 
        class="text-xs text-gray-500 mt-1"
        :class="isUser ? 'text-right' : 'text-left'"
      >
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 代码块样式 */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* 消息内容链接样式 */
:deep(a) {
  color: inherit;
  text-decoration: underline;
}

/* 用户消息中的链接 */
.bg-blue-600 :deep(a) {
  color: #bfdbfe;
}

/* AI消息中的链接 */
.bg-gray-100 :deep(a) {
  color: #2563eb;
}
</style>