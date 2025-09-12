<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { User, Bot, Play, Copy, Check, Clock, CheckCircle, Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/github-dark.css'
import DOMPurify from 'dompurify'
import type { Message } from '@/stores/conversation'
import { useP5Store } from '@/stores/p5'

// 注册JavaScript语言支持
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)

interface Props {
  message: Message
}

interface Emits {
  (e: 'run-code', code: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const copied = ref(false)
const isRunning = ref(false)
const p5Store = useP5Store()

// 计算属性
const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')
const isProgress = computed(() => props.message.isProgress)
const hasCode = computed(() => !!props.message.generatedCode)
const hasRound = computed(() => props.message.round !== undefined)
const isThirdRound = computed(() => props.message.round === 3 && !props.message.isProgress)
const hasP5Code = computed(() => {
  if (isThirdRound.value) {
    return props.message.content.includes('function setup') || props.message.content.includes('function draw')
  }
  return false
})

// 轮次名称映射
const roundNames = {
  1: '需求分析',
  2: '技术评估',
  3: '代码生成'
}

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

// 从消息内容中提取p5.js代码
const extractP5Code = (content: string): string | null => {
  // 尝试匹配代码块
  const codeBlockMatch = content.match(/```(?:javascript)?\n([\s\S]*?)\n```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  
  // 如果没有代码块，但包含setup和draw函数，直接返回内容
  if (content.includes('function setup') && content.includes('function draw')) {
    return content.trim()
  }
  
  return null
}

// 运行p5.js动画
const runAnimation = async () => {
  if (!hasP5Code.value || isRunning.value) return
  
  const code = extractP5Code(props.message.content)
  if (!code) {
    console.error('无法提取p5.js代码')
    return
  }
  
  try {
    isRunning.value = true
    const success = await p5Store.createAnimation(code, '生成的数学动画', { width: 400, height: 400 })
    if (!success) {
      console.error('创建动画失败')
    }
  } catch (error) {
    console.error('运行动画时出错:', error)
  } finally {
    isRunning.value = false
  }
}

// 渲染markdown内容
const renderMarkdown = (content: string): string => {
    try {
      // 配置 marked
      marked.setOptions({
        breaks: true,
        gfm: true
      })

      // 解析 markdown
      let rawHtml = marked.parse(content) as string
      
      // 手动处理代码高亮
      rawHtml = rawHtml.replace(/<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs, (match, lang, code) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            const highlighted = hljs.highlight(code, { language: lang }).value
            return `<pre><code class="language-${lang}">${highlighted}</code></pre>`
          } catch (err) {
            console.error('Highlight error:', err)
          }
        }
        return match
      })
      
      // 使用 DOMPurify 清理 HTML
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'class', 'id']
      })
    } catch (error) {
      console.error('Markdown rendering error:', error)
      return content
    }
  }

// 格式化消息内容（处理换行）
const formatContent = (content: string) => {
  return content.replace(/\n/g, '<br>')
}
</script>

<template>
  <!-- 进度消息特殊显示 -->
  <div v-if="isProgress" class="flex items-center justify-center my-2">
    <div class="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm">
      <Loader2 v-if="message.content.includes('正在进行')" class="w-4 h-4 animate-spin" />
      <CheckCircle v-else class="w-4 h-4" />
      <span>{{ message.content }}</span>
    </div>
  </div>
  
  <!-- 普通消息显示 -->
  <div v-else class="flex space-x-3" :class="{ 'flex-row-reverse space-x-reverse': isUser }">
    <!-- 头像 -->
    <div 
      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
      :class="{
        'bg-blue-600': isUser,
        'bg-gray-600': !isUser && !hasRound,
        'bg-orange-500': hasRound && message.round === 1,
        'bg-purple-500': hasRound && message.round === 2,
        'bg-green-600': hasRound && message.round === 3
      }"
    >
      <User v-if="isUser" class="w-4 h-4 text-white" />
      <Bot v-else class="w-4 h-4 text-white" />
    </div>
    
    <!-- 消息内容 -->
    <div class="flex-1 max-w-[80%]">
      <!-- 轮次标识 -->
      <div v-if="hasRound && !isUser" class="mb-2">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-orange-100 text-orange-800': message.round === 1,
                'bg-purple-100 text-purple-800': message.round === 2,
                'bg-green-100 text-green-800': message.round === 3
              }">
          第{{ message.round }}轮：{{ roundNames[message.round] }}
        </span>
      </div>
      
      <!-- 消息气泡 -->
      <div 
        class="px-4 py-3 rounded-lg"
        :class="{
          'bg-blue-600 text-white ml-auto': isUser,
          'bg-gray-100 text-gray-800': !isUser && !hasRound,
          'bg-orange-50 border border-orange-200 text-orange-900': hasRound && message.round === 1,
          'bg-purple-50 border border-purple-200 text-purple-900': hasRound && message.round === 2,
          'bg-green-50 border border-green-200 text-green-900': hasRound && message.round === 3
        }"
      >
        <div 
          class="text-sm leading-relaxed prose prose-sm max-w-none"
          :class="{
            'prose-invert': isUser,
            'prose-orange': hasRound && message.round === 1,
            'prose-purple': hasRound && message.round === 2,
            'prose-green': hasRound && message.round === 3
          }"
          v-html="renderMarkdown(message.content)"
        ></div>
      </div>
      
      <!-- 第三轮代码运行按钮 -->
      <div v-if="isThirdRound && hasP5Code" class="mt-3">
        <button
          @click="runAnimation"
          :disabled="isRunning"
          class="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Loader2 v-if="isRunning" class="w-4 h-4 animate-spin" />
          <Play v-else class="w-4 h-4" />
          <span>{{ isRunning ? '正在运行...' : '运行动画' }}</span>
        </button>
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

/* Markdown prose样式覆盖 */
:deep(.prose) {
  color: inherit;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  color: inherit;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

:deep(.prose p) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  padding-left: 1.5em;
}

:deep(.prose li) {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

:deep(.prose code) {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

:deep(.prose pre) {
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

:deep(.prose pre code) {
  padding: 0;
  color: inherit;
}

:deep(.prose blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  margin-left: 0;
  font-style: italic;
  color: #6b7280;
}

/* 消息内容链接样式 */
:deep(.prose a) {
  color: inherit;
  text-decoration: underline;
}

/* 用户消息中的链接 */
.bg-blue-600 :deep(.prose a) {
  color: #bfdbfe;
}

/* AI消息中的链接 */
.bg-gray-100 :deep(.prose a) {
  color: #2563eb;
}

/* 轮次特定的样式 */
.bg-orange-50 :deep(.prose a) {
  color: #ea580c;
}

.bg-purple-50 :deep(.prose a) {
  color: #9333ea;
}

.bg-green-50 :deep(.prose a) {
  color: #16a34a;
}

/* 用户消息中的代码样式 */
.bg-blue-600 :deep(.prose code) {
  color: #e5e7eb;
}

/* 轮次消息中的代码样式 */
.bg-orange-50 :deep(.prose code) {
  color: #ea580c;
}

.bg-purple-50 :deep(.prose code) {
  color: #9333ea;
}

.bg-green-50 :deep(.prose code) {
  color: #16a34a;
}
</style>