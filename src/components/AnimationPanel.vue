<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Play, Code, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useP5Store } from '@/stores/p5'
import CodeEditor from '@/components/CodeEditor.vue'

const p5Store = useP5Store()
const showCodeEditor = ref(false)

// 清理
onUnmounted(() => {
  p5Store.clearAnimation()
})

// 切换代码编辑器显示
const toggleCodeEditor = () => {
  showCodeEditor.value = !showCodeEditor.value
}

// 运行示例代码
const runExample = async (type: string) => {
  const exampleCode = p5Store.getExampleCode(type)
  await p5Store.createAnimation(exampleCode, `示例：${type}`)
}
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 动画头部控制栏 -->
    <div class="px-3 lg:px-4 py-2 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <h2 class="text-sm lg:text-base font-semibold text-gray-800">动画展示</h2>
          <div v-if="p5Store.hasAnimation" class="hidden sm:flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-green-600">已加载</span>
          </div>
        </div>
        
        <!-- 控制按钮 -->
        <div class="flex items-center space-x-1 lg:space-x-2">
          <button
            @click="toggleCodeEditor"
            class="flex items-center space-x-1 px-2 lg:px-3 py-1 lg:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            title="显示/隐藏代码编辑器"
          >
            <Code class="w-3 h-3 lg:w-4 lg:h-4" />
            <ChevronUp v-if="showCodeEditor" class="w-2 h-2 lg:w-3 lg:h-3" />
            <ChevronDown v-else class="w-2 h-2 lg:w-3 lg:h-3" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 动画区域 -->
      <div class="flex-1 bg-gray-100 relative">
        <!-- iframe容器 -->
        <div class="w-full h-full">
          <!-- 空状态 -->
          <div v-if="!p5Store.hasAnimation && !p5Store.isLoading" 
               class="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <div class="text-center px-4">
              <div class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Play class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 class="text-base sm:text-lg font-medium text-gray-700 mb-2">等待动画</h3>
              <p class="text-xs sm:text-sm text-gray-500 mb-4">在对话框中描述你想要的动画效果</p>
              
              <!-- 示例按钮 -->
              <div class="space-y-2">
                <p class="text-xs text-gray-400 mb-2">或者试试这些示例：</p>
                <div class="flex flex-wrap gap-2 justify-center">
                  <button
                    @click="runExample('basic')"
                    class="px-2 sm:px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    基础动画
                  </button>
                  <button
                    @click="runExample('sine')"
                    class="px-2 sm:px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    正弦波
                  </button>
                  <button
                    @click="runExample('fractal')"
                    class="px-2 sm:px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    分形树
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="p5Store.isLoading" 
               class="w-full h-full flex items-center justify-center">
            <div class="text-center">
              <div class="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-xs sm:text-sm text-gray-600">正在生成动画...</p>
            </div>
          </div>
          
          <!-- 动画iframe -->
          <iframe 
            v-if="p5Store.animationUrl && !p5Store.isLoading"
            :src="p5Store.animationUrl"
            class="w-full h-full border-0"
            title="p5.js Animation"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="p5Store.hasError" 
             class="absolute top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg shadow-lg">
          <p class="text-sm font-medium">{{ p5Store.error }}</p>
          <button 
            @click="p5Store.clearError"
            class="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            关闭
          </button>
        </div>
      </div>
      
      <!-- 代码编辑器 -->
      <div v-if="showCodeEditor" class="h-64 border-t border-gray-200">
        <CodeEditor />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* iframe全屏样式 */
iframe {
  display: block;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
}
</style>