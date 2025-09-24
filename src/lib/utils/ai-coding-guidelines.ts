// AI 코딩 가이드라인 및 칼럼명 검증 도구

export interface CodingGuideline {
  id: string;
  category: string;
  title: string;
  description: string;
  examples: {
    good: string[];
    bad: string[];
  };
  severity: "error" | "warning" | "info";
}

export interface ValidationRule {
  pattern: RegExp;
  message: string;
  severity: "error" | "warning" | "info";
}

// AI 코딩 가이드라인 정의
export const AI_CODING_GUIDELINES: CodingGuideline[] = [
  {
    id: "column-naming",
    category: "Database",
    title: "칼럼명 명명 규칙",
    description: "데이터베이스 칼럼명은 소문자와 언더스코어를 사용해야 합니다.",
    examples: {
      good: ["user_id", "created_at", "first_name", "budget_total"],
      bad: ["userId", "CreatedAt", "firstName", "budget-total", "BudgetTotal"],
    },
    severity: "error",
  },
  {
    id: "table-naming",
    category: "Database",
    title: "테이블명 명명 규칙",
    description: "테이블명은 복수형 소문자와 언더스코어를 사용해야 합니다.",
    examples: {
      good: [
        "projects",
        "project_budgets",
        "project_members",
        "evidence_items",
      ],
      bad: ["Project", "projectBudget", "project-members", "EvidenceItems"],
    },
    severity: "error",
  },
  {
    id: "foreign-key-naming",
    category: "Database",
    title: "외래키 명명 규칙",
    description: "외래키는 참조하는 테이블명_id 형태여야 합니다.",
    examples: {
      good: ["project_id", "employee_id", "category_id", "budget_id"],
      bad: ["projectId", "employee", "cat_id", "budgetId"],
    },
    severity: "error",
  },
  {
    id: "api-endpoint-naming",
    category: "API",
    title: "API 엔드포인트 명명 규칙",
    description: "API 엔드포인트는 kebab-case를 사용해야 합니다.",
    examples: {
      good: [
        "/api/project-management/projects",
        "/api/project-management/budget-validation",
      ],
      bad: [
        "/api/projectManagement/projects",
        "/api/project_management/budgetValidation",
      ],
    },
    severity: "error",
  },
  {
    id: "variable-naming",
    category: "JavaScript/TypeScript",
    title: "변수명 명명 규칙",
    description: "JavaScript/TypeScript 변수명은 camelCase를 사용해야 합니다.",
    examples: {
      good: ["projectId", "budgetTotal", "isValid", "validationResults"],
      bad: ["project_id", "budget_total", "is_valid", "validation_results"],
    },
    severity: "error",
  },
  {
    id: "function-naming",
    category: "JavaScript/TypeScript",
    title: "함수명 명명 규칙",
    description: "함수명은 동사로 시작하는 camelCase를 사용해야 합니다.",
    examples: {
      good: [
        "validateProject",
        "calculateBudget",
        "getEmployeeInfo",
        "createValidationResult",
      ],
      bad: [
        "project_validate",
        "budget_calculate",
        "employee_info",
        "validation_result_create",
      ],
    },
    severity: "error",
  },
  {
    id: "class-naming",
    category: "JavaScript/TypeScript",
    title: "클래스명 명명 규칙",
    description: "클래스명은 PascalCase를 사용해야 합니다.",
    examples: {
      good: [
        "ValidationUtils",
        "PersonnelCostValidator",
        "ProjectManager",
        "BudgetCalculator",
      ],
      bad: [
        "validation_utils",
        "personnelCostValidator",
        "project_manager",
        "budget_calculator",
      ],
    },
    severity: "error",
  },
  {
    id: "constant-naming",
    category: "JavaScript/TypeScript",
    title: "상수명 명명 규칙",
    description: "상수명은 UPPER_SNAKE_CASE를 사용해야 합니다.",
    examples: {
      good: ["DEFAULT_VALIDATION_RULES", "MAX_RETRY_COUNT", "API_BASE_URL"],
      bad: ["defaultValidationRules", "maxRetryCount", "apiBaseUrl"],
    },
    severity: "warning",
  },
  {
    id: "sql-query-formatting",
    category: "SQL",
    title: "SQL 쿼리 포맷팅",
    description:
      "SQL 쿼리는 가독성을 위해 적절히 들여쓰기하고 줄바꿈해야 합니다.",
    examples: {
      good: [
        `SELECT 
					p.id,
					p.title,
					p.budget_total
				FROM projects p
				WHERE p.status = 'active'
				ORDER BY p.created_at DESC`,
      ],
      bad: [
        `SELECT p.id, p.title, p.budget_total FROM projects p WHERE p.status = 'active' ORDER BY p.created_at DESC`,
      ],
    },
    severity: "warning",
  },
  {
    id: "error-handling",
    category: "Error Handling",
    title: "에러 처리 규칙",
    description:
      "모든 API 호출과 데이터베이스 작업에는 적절한 에러 처리가 필요합니다.",
    examples: {
      good: [
        `try {
					const result = await pool.query(query, params);
					return result.rows;
				} catch (error) {
					logger.error('Database query error:', error);
					throw new Error('데이터베이스 쿼리 실패');
				}`,
      ],
      bad: [
        `const result = await pool.query(query, params);
				return result.rows;`,
      ],
    },
    severity: "error",
  },
];

// 검증 규칙 정의
export const VALIDATION_RULES: ValidationRule[] = [
  // 칼럼명 규칙
  {
    pattern: /^[a-z][a-z0-9_]*$/,
    message:
      "칼럼명은 소문자로 시작하고, 소문자, 숫자, 언더스코어만 사용할 수 있습니다.",
    severity: "error",
  },
  {
    pattern: /^[a-z][a-z0-9_]*_id$/,
    message: "외래키 칼럼명은 테이블명_id 형태여야 합니다.",
    severity: "error",
  },
  // 변수명 규칙
  {
    pattern: /^[a-z][a-zA-Z0-9]*$/,
    message: "변수명은 camelCase를 사용해야 합니다.",
    severity: "error",
  },
  // 함수명 규칙
  {
    pattern: /^[a-z][a-zA-Z0-9]*$/,
    message: "함수명은 동사로 시작하는 camelCase를 사용해야 합니다.",
    severity: "error",
  },
  // 클래스명 규칙
  {
    pattern: /^[A-Z][a-zA-Z0-9]*$/,
    message: "클래스명은 PascalCase를 사용해야 합니다.",
    severity: "error",
  },
  // 상수명 규칙
  {
    pattern: /^[A-Z][A-Z0-9_]*$/,
    message: "상수명은 UPPER_SNAKE_CASE를 사용해야 합니다.",
    severity: "warning",
  },
];

// AI 코딩 가이드라인 검증 도구
export class AICodingValidator {
  /**
   * 칼럼명 검증
   */
  static validateColumnName(columnName: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 1. 소문자 검증
    if (columnName !== columnName.toLowerCase()) {
      issues.push("칼럼명은 소문자로 작성해야 합니다.");
    }

    // 2. 언더스코어 사용 검증
    if (columnName.includes("-") || /[A-Z]/.test(columnName)) {
      issues.push("칼럼명은 언더스코어(_)를 사용해야 합니다. (camelCase 금지)");
    }

    // 3. 예약어 검증
    const reservedWords = [
      "name",
      "type",
      "order",
      "group",
      "user",
      "date",
      "time",
    ];
    if (reservedWords.includes(columnName.toLowerCase())) {
      issues.push(`예약어 '${columnName}' 사용을 피해야 합니다.`);
    }

    // 4. 패턴 검증
    const columnRule = VALIDATION_RULES.find((rule) =>
      rule.message.includes("칼럼명"),
    );
    if (columnRule && !columnRule.pattern.test(columnName)) {
      issues.push(columnRule.message);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * 변수명 검증
   */
  static validateVariableName(variableName: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 1. camelCase 검증
    if (!/^[a-z][a-zA-Z0-9]*$/.test(variableName)) {
      issues.push("변수명은 camelCase를 사용해야 합니다.");
    }

    // 2. 언더스코어 사용 금지
    if (variableName.includes("_")) {
      issues.push("변수명에는 언더스코어(_)를 사용하지 마세요.");
    }

    // 3. 대문자로 시작 금지
    if (/^[A-Z]/.test(variableName)) {
      issues.push("변수명은 소문자로 시작해야 합니다.");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * 함수명 검증
   */
  static validateFunctionName(functionName: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 1. camelCase 검증
    if (!/^[a-z][a-zA-Z0-9]*$/.test(functionName)) {
      issues.push("함수명은 camelCase를 사용해야 합니다.");
    }

    // 2. 동사로 시작하는지 검증
    const verbPrefixes = [
      "get",
      "set",
      "create",
      "update",
      "delete",
      "validate",
      "calculate",
      "check",
      "find",
      "search",
      "parse",
      "format",
      "convert",
      "transform",
      "process",
      "handle",
      "execute",
      "run",
      "start",
      "stop",
      "init",
      "load",
      "save",
      "export",
      "import",
    ];
    const startsWithVerb = verbPrefixes.some((prefix) =>
      functionName.startsWith(prefix),
    );

    if (!startsWithVerb) {
      issues.push(
        "함수명은 동사로 시작해야 합니다. (예: get, set, create, validate 등)",
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * 클래스명 검증
   */
  static validateClassName(className: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 1. PascalCase 검증
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      issues.push("클래스명은 PascalCase를 사용해야 합니다.");
    }

    // 2. 명사로 끝나는지 검증
    const nounSuffixes = [
      "Manager",
      "Validator",
      "Calculator",
      "Handler",
      "Service",
      "Controller",
      "Repository",
      "Model",
      "Entity",
      "Utils",
      "Helper",
      "Factory",
      "Builder",
    ];
    const endsWithNoun = nounSuffixes.some((suffix) =>
      className.endsWith(suffix),
    );

    if (!endsWithNoun) {
      issues.push(
        "클래스명은 명사로 끝나야 합니다. (예: Manager, Validator, Utils 등)",
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * SQL 쿼리 검증
   */
  static validateSQLQuery(query: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 1. SQL 인젝션 방지 검증
    const dangerousPatterns = [
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*truncate/i,
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        issues.push("위험한 SQL 패턴이 감지되었습니다.");
        break;
      }
    }

    // 2. 파라미터화된 쿼리 사용 검증
    if (query.includes("'") && !query.includes("$")) {
      issues.push("하드코딩된 문자열 대신 파라미터화된 쿼리를 사용하세요.");
    }

    // 3. 적절한 들여쓰기 검증
    const lines = query.split("\n");
    let hasIndentation = false;
    for (const line of lines) {
      if (line.trim() && line.startsWith("  ")) {
        hasIndentation = true;
        break;
      }
    }

    if (lines.length > 3 && !hasIndentation) {
      issues.push("SQL 쿼리는 가독성을 위해 적절히 들여쓰기하세요.");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * 전체 코드 검증
   */
  static validateCode(
    code: string,
    language: "typescript" | "sql" | "javascript",
  ): {
    isValid: boolean;
    issues: Array<{
      type: string;
      message: string;
      severity: "error" | "warning" | "info";
    }>;
  } {
    const issues: Array<{
      type: string;
      message: string;
      severity: "error" | "warning" | "info";
    }> = [];

    if (language === "sql") {
      const sqlValidation = this.validateSQLQuery(code);
      if (!sqlValidation.isValid) {
        issues.push(
          ...sqlValidation.issues.map((issue) => ({
            type: "sql",
            message: issue,
            severity: "error" as const,
          })),
        );
      }
    }

    // TypeScript/JavaScript 코드 검증
    if (language === "typescript" || language === "javascript") {
      // 에러 처리 검증
      if (
        code.includes("await") &&
        !code.includes("try") &&
        !code.includes("catch")
      ) {
        issues.push({
          type: "error-handling",
          message: "비동기 작업에는 적절한 에러 처리가 필요합니다.",
          severity: "error",
        });
      }

      // 타입 안전성 검증
      if (language === "typescript" && code.includes("any")) {
        issues.push({
          type: "type-safety",
          message: "any 타입 사용을 피하고 구체적인 타입을 사용하세요.",
          severity: "warning",
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * 가이드라인 조회
   */
  static getGuidelines(category?: string): CodingGuideline[] {
    if (category) {
      return AI_CODING_GUIDELINES.filter(
        (guideline) => guideline.category === category,
      );
    }
    return AI_CODING_GUIDELINES;
  }

  /**
   * 검증 규칙 조회
   */
  static getValidationRules(): ValidationRule[] {
    return VALIDATION_RULES;
  }
}

