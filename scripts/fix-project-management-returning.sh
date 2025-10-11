#!/bin/bash
# 프로젝트 관리 모듈의 남은 RETURNING * 리스트
echo "🔍 남은 RETURNING * 찾기..."
grep -rn "RETURNING \*" src/routes/api/project-management --include="*.ts" | head -30

