<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Eye, EyeOff } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// 本地状态
const showApiKey = ref(false)

// 计算属性
const isValidUrl = computed(() => {
  return settingsStore.validateUrl(settingsStore.settings.baseUrl)
})

const isValidApiKey = computed(() => {
  return settingsStore.validateApiKey(settingsStore.settings.apiKey)
})

// 监听设置变化，自动保存
watch(() => settingsStore.settings, () => {
  settingsStore.saveToLocalStorage()
}, { deep: true })

// 关闭模态框
const closeModal = () => {
  settingsStore.closeModal()
}

// 切换API密钥显示
const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value
}
</script>

<template>
  <!-- 模态框遮罩 -->
  <div 
    v-if="settingsStore.isModalOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeModal"
  >
    <!-- 模态框内容 -->
    <div 
      class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- 固定头部 -->
      <div class="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-200 rounded-t-2xl">
        <h2 class="text-xl font-semibold text-gray-800">设置</h2>
        <button
          @click="closeModal"
          class="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 内容 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- OpenAI API 配置 -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-800">OpenAI API 配置</h3>
          
          <!-- API 密钥 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              API 密钥 *
            </label>
            <div class="relative">
              <input
                v-model="settingsStore.settings.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="sk-..."
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                :class="{
                  'border-red-300': settingsStore.settings.apiKey && !isValidApiKey
                }"
              />
              <button
                @click="toggleApiKeyVisibility"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <Eye v-if="!showApiKey" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              从 <a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-600 hover:underline">OpenAI 控制台</a> 获取API密钥
            </p>
          </div>
          
          <!-- Base URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Base URL *
            </label>
            <input
              v-model="settingsStore.settings.baseUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{
                'border-red-300': settingsStore.settings.baseUrl && !isValidUrl
              }"
            />
            <p class="text-xs text-gray-500 mt-1">
              API服务器的完整URL地址，支持OpenAI官方API或兼容的第三方服务
            </p>
          </div>
          
          <!-- 模型配置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              模型
            </label>
            <input
              v-model="settingsStore.settings.model"
              type="text"
              placeholder="gpt-4"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">
              输入要使用的模型名称，如 gpt-4、gpt-3.5-turbo 等
            </p>
          </div>
        </div>
        
        <!-- 模型参数 -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-800">模型参数</h3>
          
          <!-- 温度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              温度 ({{ settingsStore.settings.temperature }})
            </label>
            <input
              v-model.number="settingsStore.settings.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="w-full h-2 bg-gray-200 rounded-xl appearance-none cursor-pointer slider"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>更保守 (0)</span>
              <span>更创造性 (2)</span>
            </div>
          </div>
          
          <!-- 最大 Tokens -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              最大 Tokens
            </label>
            <input
              v-model.number="settingsStore.settings.maxTokens"
              type="number"
              min="100"
              max="4000"
              step="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p class="text-xs text-gray-500 mt-1">
              控制AI回复的最大长度 (100-4000)
            </p>
          </div>
        </div>
        
        <!-- 系统提示词 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            系统提示词
          </label>
          <textarea
            v-model="settingsStore.settings.systemPrompt"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            placeholder="定义AI的行为和回复风格..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            这将影响AI如何理解和回应你的请求
          </p>
        </div>
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
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 自定义滑块样式 */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  background: #1d4ed8;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  background: #1d4ed8;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.slider::-moz-range-track {
  background: #e5e7eb;
  border-radius: 10px;
  height: 8px;
}
</style>