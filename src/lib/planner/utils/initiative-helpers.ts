/**
 * Stage related helpers
 */
export function getStageText(stage: string): string {
  switch (stage) {
    case 'shaping':
      return '구체화'
    case 'building':
      return '개발'
    case 'testing':
      return '검증'
    case 'shipping':
      return '배포'
    case 'done':
      return '완료'
    default:
      return stage
  }
}

export function getStageColor(stage: string): string {
  switch (stage) {
    case 'shaping':
      return 'gray'
    case 'building':
      return 'blue'
    case 'testing':
      return 'purple'
    case 'shipping':
      return 'orange'
    case 'done':
      return 'green'
    default:
      return 'gray'
  }
}

/**
 * Status related helpers
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return '진행 중'
    case 'paused':
      return '일시중지'
    case 'shipped':
      return '완료'
    case 'abandoned':
      return '중단'
    default:
      return status
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'blue'
    case 'paused':
      return 'orange'
    case 'shipped':
      return 'green'
    case 'abandoned':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Thread shape related helpers
 */
export function getShapeText(shape: string): string {
  switch (shape) {
    case 'block':
      return '차단'
    case 'question':
      return '질문'
    case 'decision':
      return '결정'
    case 'build':
      return '실행'
    case 'research':
      return '조사'
    default:
      return shape
  }
}

export function getShapeColor(shape: string): string {
  switch (shape) {
    case 'block':
      return 'red'
    case 'question':
      return 'yellow'
    case 'decision':
      return 'purple'
    case 'build':
      return 'blue'
    case 'research':
      return 'green'
    default:
      return 'gray'
  }
}

/**
 * Link type helpers
 */
export function getLinkTypeLabel(type: string): string {
  switch (type) {
    case 'doc':
      return '문서'
    case 'figma':
      return 'Figma'
    case 'notion':
      return 'Notion'
    default:
      return '기타'
  }
}
