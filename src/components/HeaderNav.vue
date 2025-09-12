<script setup lang="ts">
import { Settings, Github, Zap } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const openSettings = () => {
  settingsStore.openModal()
}

const openGithub = () => {
  window.open('https://github.com/linkxzhou/SimpleMath', '_blank')
}
</script>

<template>
  <header class="bg-blue-800 text-white px-4 lg:px-6 py-2 flex items-center justify-between shadow-lg">
    <!-- 左侧标题 -->
    <div class="flex items-center space-x-2 lg:space-x-3">
      <div class="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 bg-blue-600 rounded-lg">
        <Zap class="w-4 h-4 lg:w-5 lg:h-5" />
      </div>
      <div>
        <h1 class="text-lg lg:text-xl font-bold">SimpleMath</h1>
        <p class="text-blue-200 text-xs lg:text-sm hidden sm:block">算法可视化演示平台</p>
      </div>
    </div>
    
    <!-- 右侧操作按钮 -->
    <div class="flex items-center space-x-2 lg:space-x-4">
      <!-- API状态指示器 -->
      <div class="hidden md:flex items-center space-x-2">
        <div 
          :class="[
            'w-2 h-2 rounded-full',
            settingsStore.isConfigured ? 'bg-green-400' : 'bg-red-400'
          ]"
        ></div>
        <span class="text-sm text-blue-200">
          {{ settingsStore.isConfigured ? 'API已配置' : 'API未配置' }}
        </span>
      </div>
      
      <!-- GitHub链接 -->
      <button
        @click="openGithub"
        class="p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200 hidden sm:block"
        title="查看GitHub仓库"
      >
        <Github class="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
      
      <!-- 设置按钮 -->
      <button
        @click="openSettings"
        class="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1 lg:py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors duration-200"
        title="打开设置"
      >
        <Settings class="w-4 h-4" />
        <span class="text-sm font-medium hidden sm:inline">设置</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* 添加一些自定义样式 */
header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}
</style>