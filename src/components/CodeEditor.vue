<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Play, Copy, Download, RotateCcw, Check } from 'lucide-vue-next'
import { useP5Store } from '@/stores/p5'
import * as monaco from 'monaco-editor'

// 配置Monaco编辑器的worker
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

const p5Store = useP5Store()
const editorContainer = ref<HTMLElement>()
const copied = ref(false)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 初始化编辑器
onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    initializeEditor()
  }
})

// 监听p5Store的动画变化
watch(() => p5Store.currentAnimation, (animation) => {
  if (editor && animation && animation.code !== editor.getValue()) {
    editor.setValue(animation.code)
  }
})

// 初始化Monaco编辑器
const initializeEditor = () => {
  if (!editorContainer.value) return

  // 配置Monaco编辑器
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types']
  })

  // 添加p5.js类型定义
  const p5Types = `
    declare function setup(): void;
    declare function draw(): void;
    declare function createCanvas(width: number, height: number): any;
    declare function background(color: any): void;
    declare function fill(color: any): void;
    declare function noFill(): void;
    declare function stroke(color: any): void;
    declare function noStroke(): void;
    declare function strokeWeight(weight: number): void;
    declare function rect(x: number, y: number, w: number, h: number): void;
    declare function circle(x: number, y: number, d: number): void;
    declare function ellipse(x: number, y: number, w: number, h: number): void;
    declare function line(x1: number, y1: number, x2: number, y2: number): void;
    declare function point(x: number, y: number): void;
    declare function translate(x: number, y: number): void;
    declare function rotate(angle: number): void;
    declare function push(): void;
    declare function pop(): void;
    declare function sin(angle: number): number;
    declare function cos(angle: number): number;
    declare function tan(angle: number): number;
    declare function map(value: number, start1: number, stop1: number, start2: number, stop2: number): number;
    declare function random(min?: number, max?: number): number;
    declare function noise(x: number, y?: number, z?: number): number;
    declare function text(str: string, x: number, y: number): void;
    declare function textSize(size: number): void;
    declare function textAlign(horizAlign: any, vertAlign?: any): void;
    declare function beginShape(): void;
    declare function endShape(mode?: any): void;
    declare function vertex(x: number, y: number): void;
    declare function bezier(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): void;
    declare function curve(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): void;
    declare function rectMode(mode: any): void;
    declare function ellipseMode(mode: any): void;
    declare function imageMode(mode: any): void;
    declare function blendMode(mode: any): void;
    declare function filter(kind: any, param?: number): void;
    declare function tint(color: any): void;
    declare function noTint(): void;
    declare function loop(): void;
    declare function noLoop(): void;
    declare function frameRate(fps?: number): number;
    declare function redraw(): void;
    
    declare const PI: number;
    declare const TWO_PI: number;
    declare const HALF_PI: number;
    declare const QUARTER_PI: number;
    declare const TAU: number;
    declare const CENTER: any;
    declare const CORNER: any;
    declare const CORNERS: any;
    declare const RADIUS: any;
    declare const CLOSE: any;
    
    declare let width: number;
    declare let height: number;
    declare let mouseX: number;
    declare let mouseY: number;
    declare let pmouseX: number;
    declare let pmouseY: number;
    declare let mouseIsPressed: boolean;
    declare let key: string;
    declare let keyCode: number;
    declare let keyIsPressed: boolean;
    declare let frameCount: number;
  `

  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    p5Types,
    'file:///node_modules/@types/p5/index.d.ts'
  )

  // 创建编辑器实例
  editor = monaco.editor.create(editorContainer.value, {
    value: p5Store.currentAnimation?.code || '',
    language: 'javascript',
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    insertSpaces: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    glyphMargin: false,
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'line',
    selectOnLineNumbers: true,
    bracketPairColorization: {
      enabled: true
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showVariables: true
    }
  })

  // 监听编辑器内容变化
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const newCode = editor.getValue()
      // 代码变化时不需要特殊处理，因为现在通过API调用
    }
  })

  // 添加快捷键
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    runCurrentCode()
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    // 阻止默认保存行为
  })
}

// 运行当前代码
const runCurrentCode = () => {
  if (editor) {
    const code = editor.getValue()
    p5Store.createAnimation(code)
  }
}

// 复制代码
const copyCode = async () => {
  if (!editor) return
  
  try {
    const code = editor.getValue()
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

// 下载代码
const downloadCode = () => {
  if (!editor) return
  
  const code = editor.getValue()
  const blob = new Blob([code], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `simplemath-animation-${Date.now()}.js`
  link.click()
  URL.revokeObjectURL(url)
}

// 重置代码
const resetCode = () => {
  if (confirm('确定要重置代码吗？未保存的更改将丢失。')) {
    if (editor) {
      editor.setValue('')
    }
  }
}

// 插入示例代码
const insertExample = (type: string) => {
  if (!editor) return
  
  const exampleCode = p5Store.getExampleCode(type)
  editor.setValue(exampleCode)
}
</script>

<template>
  <div class="h-full flex flex-col bg-gray-900">
    <!-- 编辑器头部 -->
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-medium text-gray-200">代码编辑器</h3>
        <span class="text-xs text-gray-400">JavaScript (p5.js)</span>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- 示例代码按钮 -->
        <div class="flex items-center space-x-1">
          <button
            @click="insertExample('basic')"
            class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="插入基础示例"
          >
            基础
          </button>
          <button
            @click="insertExample('sine')"
            class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="插入正弦波示例"
          >
            正弦波
          </button>
          <button
            @click="insertExample('fractal')"
            class="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            title="插入分形示例"
          >
            分形
          </button>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center space-x-1 border-l border-gray-600 pl-2">
          <button
            @click="copyCode"
            class="p-1 text-gray-400 hover:text-white transition-colors"
            :title="copied ? '已复制' : '复制代码'"
          >
            <Check v-if="copied" class="w-4 h-4 text-green-400" />
            <Copy v-else class="w-4 h-4" />
          </button>
          
          <button
            @click="downloadCode"
            class="p-1 text-gray-400 hover:text-white transition-colors"
            title="下载代码"
          >
            <Download class="w-4 h-4" />
          </button>
          
          <button
            @click="resetCode"
            class="p-1 text-gray-400 hover:text-white transition-colors"
            title="重置代码"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          
          <button
            @click="runCurrentCode"
            class="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            title="运行代码 (Ctrl+Enter)"
          >
            <Play class="w-3 h-3" />
            <span>运行</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑器容器 -->
    <div ref="editorContainer" class="flex-1"></div>
    
    <!-- 底部提示 -->
    <div class="px-4 py-2 bg-gray-800 border-t border-gray-700">
      <p class="text-xs text-gray-400">
        快捷键: Ctrl+Enter 运行代码 | 支持p5.js语法高亮和自动补全
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Monaco编辑器容器样式 */
.monaco-editor {
  background-color: #1e1e1e !important;
}
</style>