import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface P5Animation {
  id: string
  url: string
  code: string
  title?: string
  width: number
  height: number
}

export const useP5Store = defineStore('p5', () => {
  // 状态
  const currentAnimation = ref<P5Animation | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const animationUrl = ref<string | null>(null)
  
  // 后端API配置
  const API_BASE_URL = 'http://localhost:3001'

  // 计算属性
  const hasAnimation = computed(() => currentAnimation.value !== null)
  const hasError = computed(() => error.value !== null)
  const isReady = computed(() => !isLoading.value && !hasError.value)

  // 创建动画
  const createAnimation = async (code: string, title?: string, width: number = 400, height: number = 400) => {
    try {
      isLoading.value = true
      error.value = null
      
      // 调用后端API创建动画
      const response = await fetch(`${API_BASE_URL}/api/p5/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          title,
          width,
          height
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create animation')
      }
      
      // 更新状态
      currentAnimation.value = {
        id: result.id,
        url: result.url,
        code,
        title,
        width,
        height
      }
      
      animationUrl.value = result.url

      return true
    } catch (err) {
      console.error('Failed to create animation:', err)
      error.value = `创建动画失败: ${err instanceof Error ? err.message : String(err)}`
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 清除当前动画
  const clearAnimation = () => {
    currentAnimation.value = null
    animationUrl.value = null
    error.value = null
  }

  // 获取动画信息
  const getAnimationInfo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/p5/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get animation info')
      }
      
      return result
    } catch (err) {
      console.error('Failed to get animation info:', err)
      error.value = `获取动画信息失败: ${err instanceof Error ? err.message : String(err)}`
      return null
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 获取示例代码
  const getExampleCode = (type: string = 'basic') => {
    const examples = {
      basic: `// 基础动画示例
function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(20);
  
  // 绘制旋转的正方形
  push();
  translate(width/2, height/2);
  rotate(frameCount * 0.02);
  fill(100, 150, 255);
  rectMode(CENTER);
  rect(0, 0, 100, 100);
  pop();
  
  // 显示帧数
  fill(255);
  text('Frame: ' + frameCount, 10, 20);
}`,
      
      sine: `// 正弦波动画
let angle = 0;

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(20);
  
  // 绘制正弦波
  stroke(100, 150, 255);
  strokeWeight(2);
  noFill();
  
  beginShape();
  for (let x = 0; x < width; x += 5) {
    let y = height/2 + sin(angle + x * 0.02) * 100;
    vertex(x, y);
  }
  endShape();
  
  // 绘制移动的点
  let x = (frameCount * 2) % width;
  let y = height/2 + sin(angle + x * 0.02) * 100;
  
  fill(255, 100, 100);
  noStroke();
  circle(x, y, 10);
  
  angle += 0.02;
}`,
      
      fractal: `// 简单分形树
function setup() {
  createCanvas(800, 600);
}

function draw() {
  background(20);
  
  stroke(150, 255, 150);
  strokeWeight(2);
  
  // 从底部中心开始绘制树
  translate(width/2, height);
  branch(80);
}

function branch(len) {
  line(0, 0, 0, -len);
  translate(0, -len);
  
  if (len > 4) {
    push();
    rotate(PI/6);
    branch(len * 0.67);
    pop();
    
    push();
    rotate(-PI/6);
    branch(len * 0.67);
    pop();
  }
}`
    }
    
    return examples[type as keyof typeof examples] || examples.basic
  }

  return {
    // 状态
    currentAnimation,
    isLoading,
    error,
    animationUrl,
    
    // 计算属性
    hasAnimation,
    hasError,
    isReady,
    
    // 方法
    createAnimation,
    clearAnimation,
    getAnimationInfo,
    clearError,
    getExampleCode
  }
})