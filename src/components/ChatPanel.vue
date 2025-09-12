<script setup lang="ts">
import { ref, computed, nextTick, onMounted, inject } from 'vue'
import { Send, Loader2, MessageSquare, Trash2, CheckCircle, Clock } from 'lucide-vue-next'
import { useConversationStore } from '@/stores/conversation'
import { useSettingsStore } from '@/stores/settings'
import { useP5Store } from '@/stores/p5'
import MessageItem from '@/components/MessageItem.vue'

const conversationStore = useConversationStore()
const settingsStore = useSettingsStore()
const p5Store = useP5Store()

// 注入动画容器尺寸信息
const animationDimensions = inject('animationDimensions', ref({ width: 600, height: 600 }))

// 进度指示器相关
const roundNames = {
  1: '需求分析',
  2: '技术评估', 
  3: '代码生成'
}

const messageInput = ref('')
const messagesContainer = ref<HTMLElement>()

// 计算属性
const canSend = computed(() => {
  return messageInput.value.trim() !== '' && 
         !conversationStore.isLoading && 
         settingsStore.isConfigured
})

const placeholder = computed(() => {
  if (!settingsStore.isConfigured) {
    return '请先在设置中配置OpenAI API密钥...'
  }
  
  return '描述你想要的数学动画效果，例如："展示傅里叶变换"、"可视化冒泡排序算法"...'
})

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!canSend.value) return
  
  const userMessage = messageInput.value.trim()
  messageInput.value = ''
  
  try {
    // 传递当前动画容器的尺寸信息
    await conversationStore.sendMessage(userMessage, animationDimensions.value)
    await scrollToBottom()
  } catch (error) {
    console.error('Send message error:', error)
  }
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 新建对话
const newConversation = () => {
  conversationStore.createNewConversation()
  p5Store.clearAnimation()
}

// 清空所有对话
const clearAllConversations = () => {
  if (confirm('确定要清空所有对话吗？此操作不可撤销。')) {
    conversationStore.clearAllConversations()
    p5Store.clearAnimation()
  }
}

// 运行代码
const runCode = async (code: string) => {
  await p5Store.createAnimation(code)
}

// 组件挂载时滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 对话头部 -->
    <div class="px-4 py-2 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <MessageSquare class="w-5 h-5 text-gray-600" />
          <h2 class="font-semibold text-gray-800">AI 对话</h2>
          <span v-if="conversationStore.currentConversation?.messages.length" 
                class="text-sm text-gray-500">
            ({{ conversationStore.currentConversation.messages.length }} 条消息)
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            @click="newConversation"
            class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            title="开始新对话"
          >
            新对话
          </button>
          
          <button
            @click="clearAllConversations"
            class="p-1 text-gray-500 hover:text-red-600 transition-colors"
            title="清空所有对话"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
      

    </div>
    
    <!-- 消息列表 -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <!-- 欢迎消息 -->
      <div v-if="!conversationStore.currentConversation?.messages.length" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageSquare class="w-8 h-8 text-blue-600" />
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">欢迎使用 SimpleMath</h3>
        <p class="text-gray-600 mb-4">描述你想要的数学动画效果，AI将为你生成对应的p5.js代码</p>
        
        <!-- 示例提示 -->
        <div class="text-left max-w-md mx-auto">
          <p class="text-sm font-medium text-gray-700 mb-2">试试这些示例：</p>
          <div class="space-y-1 text-sm text-gray-600">
            <div>• "展示正弦波动画"</div>
            <div>• "可视化冒泡排序算法"</div>
            <div>• "绘制分形树"</div>
            <div>• "演示傅里叶变换"</div>
          </div>
        </div>
      </div>
      
      <!-- 消息列表 -->
      <MessageItem
        v-for="message in conversationStore.currentConversation?.messages || []"
        :key="message.id"
        :message="message"
        @run-code="runCode"
      />
      
      <!-- 进度指示器 -->
      <div v-if="conversationStore.processingStatus.isProcessing && conversationStore.processingStatus.currentRound > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-blue-800">AI处理进度</h4>
          <div class="text-sm text-blue-600">
            {{ conversationStore.processingStatus.currentRound }}/3 轮
          </div>
        </div>
        
        <!-- 进度条 -->
        <div class="w-full bg-blue-100 rounded-full h-2 mb-4">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(conversationStore.processingStatus.currentRound / 3) * 100}%` }"
          ></div>
        </div>
        
        <!-- 轮次状态 -->
        <div class="space-y-2">
          <div 
            v-for="round in 3" 
            :key="round"
            class="flex items-center space-x-3 p-2 rounded-md"
            :class="{
              'bg-green-50 border border-green-200': conversationStore.processingStatus.completedRounds.includes(round),
              'bg-blue-50 border border-blue-200': conversationStore.processingStatus.currentRound === round,
              'bg-gray-50 border border-gray-200': conversationStore.processingStatus.currentRound < round
            }"
          >
            <!-- 状态图标 -->
            <div class="flex-shrink-0">
              <CheckCircle 
                v-if="conversationStore.processingStatus.completedRounds.includes(round)"
                class="w-5 h-5 text-green-600"
              />
              <Loader2 
                v-else-if="conversationStore.processingStatus.currentRound === round"
                class="w-5 h-5 text-blue-600 animate-spin"
              />
              <Clock 
                v-else
                class="w-5 h-5 text-gray-400"
              />
            </div>
            
            <!-- 轮次信息 -->
            <div class="flex-1">
              <div class="font-medium text-sm"
                   :class="{
                     'text-green-700': conversationStore.processingStatus.completedRounds.includes(round),
                     'text-blue-700': conversationStore.processingStatus.currentRound === round,
                     'text-gray-500': conversationStore.processingStatus.currentRound < round
                   }">
                第{{ round }}轮：{{ roundNames[round] }}
              </div>
              
              <!-- 状态文本 -->
              <div class="text-xs mt-1"
                   :class="{
                     'text-green-600': conversationStore.processingStatus.completedRounds.includes(round),
                     'text-blue-600': conversationStore.processingStatus.currentRound === round,
                     'text-gray-400': conversationStore.processingStatus.currentRound < round
                   }">
                <span v-if="conversationStore.processingStatus.completedRounds.includes(round)">
                  已完成
                </span>
                <span v-else-if="conversationStore.processingStatus.currentRound === round">
                  正在处理...
                </span>
                <span v-else>
                  等待中
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入状态指示器 -->
      <div v-if="conversationStore.isLoading && !conversationStore.processingStatus.isProcessing" class="flex items-center space-x-2 text-gray-500">
        <Loader2 class="w-4 h-4 animate-spin" />
        <span class="text-sm">AI正在思考...</span>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="p-2 border-t border-gray-200 bg-gray-50">
      <!-- API未配置提示 -->
      <div v-if="!settingsStore.isConfigured" 
           class="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          请先在设置中配置OpenAI API密钥才能开始对话
        </p>
      </div>
      
      <div class="relative">
        <textarea
          v-model="messageInput"
          :placeholder="placeholder"
          :disabled="!settingsStore.isConfigured || conversationStore.isLoading"
          @keydown="handleKeydown"
          class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows="2"
        ></textarea>
        
        <button
          @click="sendMessage"
          :disabled="!canSend"
          class="absolute bottom-4 right-2 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
        >
          <Loader2 v-if="conversationStore.isLoading" class="w-3 h-3 animate-spin" />
          <Send v-else class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>