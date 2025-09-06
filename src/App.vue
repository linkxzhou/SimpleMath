<script setup lang="ts">
import { onMounted } from 'vue'
import HeaderNav from '@/components/HeaderNav.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import AnimationPanel from '@/components/AnimationPanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  // 初始化时加载设置
  settingsStore.loadFromLocalStorage()
})
</script>

<template>
  <div id="app" class="h-screen bg-gray-50 flex flex-col">
    <!-- 顶部导航栏 -->
    <HeaderNav />
    
    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- 左侧对话面板 -->
      <div class="w-full lg:w-2/5 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-gray-200">
        <ChatPanel />
      </div>
      
      <!-- 右侧动画面板 -->
      <div class="flex-1">
        <AnimationPanel />
      </div>
    </div>
    
    <!-- 设置模态框 -->
    <SettingsModal />
  </div>
</template>

<style scoped>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>