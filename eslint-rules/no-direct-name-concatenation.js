/**
 * ESLint Rule: no-direct-name-concatenation
 *
 * 직원 이름을 직접 결합하는 패턴을 금지합니다.
 *
 * ❌ Bad:
 * - `first_name + ' ' + last_name`
 * - `first_name || ' ' || last_name` (SQL)
 * - `${first_name} ${last_name}`
 *
 * ✅ Good:
 * - `formatKoreanName(last_name, first_name)`
 * - `format_korean_name(last_name, first_name)` (SQL)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct name concatenation, use formatKoreanName instead',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      directConcatenation:
        '이름을 직접 결합하지 마세요. formatKoreanName(last_name, first_name)을 사용하세요.',
      sqlConcatenation:
        'SQL에서 이름을 직접 결합하지 마세요. format_korean_name(last_name, first_name)을 사용하세요.',
    },
    schema: [],
  },

  create(context) {
    const dangerousPatterns = [
      // JavaScript/TypeScript patterns
      /first_name\s*\+\s*['"]\s*['"]?\s*\+\s*last_name/i,
      /last_name\s*\+\s*['"]\s*['"]?\s*\+\s*first_name/i,
      /`\${.*first_name.*}.*\${.*last_name.*}`/i,
      /`\${.*last_name.*}.*\${.*first_name.*}`/i,

      // SQL patterns
      /first_name\s*\|\|\s*['"]\s*['"]?\s*\|\|\s*last_name/i,
      /last_name\s*\|\|\s*['"]\s*['"]?\s*\|\|\s*first_name/i,
      /CONCAT\s*\(\s*first_name.*last_name/i,
      /CONCAT\s*\(\s*last_name.*first_name/i,
    ]

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          const text = node.value
          const isSQLPattern = dangerousPatterns.slice(4).some((pattern) => pattern.test(text))

          if (isSQLPattern) {
            context.report({
              node,
              messageId: 'sqlConcatenation',
            })
          }
        }
      },

      TemplateLiteral(node) {
        const source = context.getSourceCode().getText(node)
        const hasFirstAndLast = source.includes('first_name') && source.includes('last_name')

        if (hasFirstAndLast) {
          context.report({
            node,
            messageId: 'directConcatenation',
          })
        }
      },

      BinaryExpression(node) {
        if (node.operator === '+') {
          const source = context.getSourceCode().getText(node)
          const isNameConcatenation = dangerousPatterns
            .slice(0, 2)
            .some((pattern) => pattern.test(source))

          if (isNameConcatenation) {
            context.report({
              node,
              messageId: 'directConcatenation',
            })
          }
        }
      },
    }
  },
}
