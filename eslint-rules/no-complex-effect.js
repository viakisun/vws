// ESLint 규칙: 복잡한 $effect 사용 금지
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '복잡한 $effect 사용을 금지합니다',
      category: 'Best Practices',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // $effect 사용 감지
        if (node.callee.name === '$effect') {
          const effectBody = node.arguments[0]?.body

          if (effectBody && effectBody.type === 'BlockStatement') {
            // 의존성 배열 사용 감지
            const hasComplexDependency = effectBody.body.some((stmt) => {
              if (stmt.type === 'ExpressionStatement') {
                const expr = stmt.expression
                // ;(a, b, c) 패턴 감지
                if (expr.type === 'SequenceExpression' && expr.expressions.length > 2) {
                  return true
                }
                // 복잡한 객체 접근 감지
                if (expr.type === 'MemberExpression' && expr.object.type === 'Identifier') {
                  return true
                }
              }
              return false
            })

            if (hasComplexDependency) {
              context.report({
                node,
                message:
                  '복잡한 $effect 사용을 피하고 이벤트 기반 접근법을 사용하세요. 예: function handleChange() { updateData() }',
              })
            }
          }
        }
      },
    }
  },
}
