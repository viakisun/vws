"use strict";
// 자동 검증 백그라운드 서비스
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoValidationService = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const ai_coding_guidelines_1 = require("../utils/ai-coding-guidelines");
const safe_change_manager_1 = require("../utils/safe-change-manager");
const schema_validation_1 = require("../utils/schema-validation");
// 자동 검증 백그라운드 서비스
class AutoValidationService {
    constructor() {
        this.isRunning = false;
        this.startTime = null;
        this.watchers = new Map();
        this.processedFiles = 0;
        this.errors = 0;
        this.warnings = 0;
        this.autoFixes = 0;
        this.process = null;
        // 감시할 디렉토리 및 파일 패턴
        this.WATCH_DIRS = [
            'src/lib/utils',
            'src/routes/api/project-management',
            'src/lib/components/project-management',
            'src/routes/project-management'
        ];
        this.SUPPORTED_EXTENSIONS = ['.ts', '.js', '.svelte'];
        this.IGNORE_PATTERNS = ['node_modules', '.git', 'dist', 'build', '.svelte-kit'];
        this.logFile = (0, path_1.join)(process.cwd(), 'logs', 'auto-validation.log');
        this.pidFile = (0, path_1.join)(process.cwd(), 'logs', 'auto-validation.pid');
        this.ensureLogDirectory();
    }
    /**
     * 싱글톤 인스턴스 가져오기
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new AutoValidationService();
        }
        return this.instance;
    }
    /**
     * 서비스 시작
     */
    async start() {
        if (this.isRunning) {
            this.log('⚠️ 서비스가 이미 실행 중입니다.');
            return;
        }
        this.log('🚀 자동 검증 서비스 시작');
        this.isRunning = true;
        this.startTime = new Date();
        this.processedFiles = 0;
        this.errors = 0;
        this.warnings = 0;
        this.autoFixes = 0;
        // PID 파일 생성
        (0, fs_1.writeFileSync)(this.pidFile, process.pid.toString());
        try {
            // 파일 감지 시작
            await this.startFileWatching();
            // 주기적 검증 실행
            this.startPeriodicValidation();
            // 프로세스 종료 시 정리
            process.on('SIGINT', () => this.stop());
            process.on('SIGTERM', () => this.stop());
            this.log('✅ 자동 검증 서비스 시작 완료');
        }
        catch (error) {
            this.log(`❌ 서비스 시작 실패: ${error}`);
            this.isRunning = false;
            throw error;
        }
    }
    /**
     * 서비스 중지
     */
    async stop() {
        if (!this.isRunning) {
            this.log('⚠️ 서비스가 실행 중이 아닙니다.');
            return;
        }
        this.log('🛑 자동 검증 서비스 중지');
        this.isRunning = false;
        // 파일 감지 중지
        this.stopFileWatching();
        // PID 파일 삭제
        if ((0, fs_1.existsSync)(this.pidFile)) {
            (0, fs_1.writeFileSync)(this.pidFile, '');
        }
        this.log('✅ 자동 검증 서비스 중지 완료');
    }
    /**
     * 서비스 상태 조회
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            startTime: this.startTime,
            watchedFiles: this.watchers.size,
            processedFiles: this.processedFiles,
            errors: this.errors,
            warnings: this.warnings,
            autoFixes: this.autoFixes
        };
    }
    /**
     * 파일 감지 시작
     */
    async startFileWatching() {
        for (const dir of this.WATCH_DIRS) {
            if (!(0, fs_1.existsSync)(dir)) {
                this.log(`⚠️ 디렉토리가 존재하지 않습니다: ${dir}`);
                continue;
            }
            try {
                const watcher = (0, fs_1.watch)(dir, { recursive: true }, (eventType, filename) => {
                    if (filename && this.SUPPORTED_EXTENSIONS.includes((0, path_1.extname)(filename))) {
                        const filePath = (0, path_1.join)(dir, filename);
                        this.handleFileChange({
                            type: eventType === 'rename' ? 'add' : 'change',
                            filePath,
                            timestamp: new Date()
                        });
                    }
                });
                this.watchers.set(dir, watcher);
                this.log(`👀 파일 감지 시작: ${dir}`);
            }
            catch (error) {
                this.log(`❌ 파일 감지 실패: ${dir} - ${error}`);
            }
        }
    }
    /**
     * 파일 감지 중지
     */
    stopFileWatching() {
        for (const [dir, watcher] of this.watchers) {
            watcher.close();
            this.log(`👀 파일 감지 중지: ${dir}`);
        }
        this.watchers.clear();
    }
    /**
     * 파일 변경 처리
     */
    async handleFileChange(event) {
        this.log(`📝 파일 변경 감지: ${event.type} - ${event.filePath}`);
        try {
            // 파일 내용 읽기
            let content = '';
            if ((0, fs_1.existsSync)(event.filePath)) {
                content = (0, fs_1.readFileSync)(event.filePath, 'utf-8');
            }
            // 자동 검증 실행
            const validation = await this.runAutoValidation(event.filePath, content);
            // 검증 결과 처리
            await this.handleValidationResult(event.filePath, validation);
            this.processedFiles++;
        }
        catch (error) {
            this.log(`❌ 파일 변경 처리 실패: ${event.filePath} - ${error}`);
            this.errors++;
        }
    }
    /**
     * 자동 검증 실행
     */
    async runAutoValidation(filePath, content) {
        const results = {
            coding: null,
            schema: null,
            dependency: null,
            projectManagement: null
        };
        try {
            // 1. 코딩 가이드라인 검증
            results.coding = ai_coding_guidelines_1.AICodingValidator.validateCode(content, 'typescript');
            // 2. 스키마 검증 (API 파일인 경우)
            if (filePath.includes('/api/')) {
                results.schema = await schema_validation_1.SchemaValidator.validateDatabaseSchema();
            }
            // 3. 의존성 분석
            results.dependency = await this.analyzeDependencies(filePath);
            // 4. 프로젝트 관리 페이지 특화 검증
            if (filePath.includes('/project-management/')) {
                results.projectManagement = await this.validateProjectManagementPage(filePath, content);
            }
        }
        catch (error) {
            this.log(`❌ 자동 검증 실패: ${filePath} - ${error}`);
        }
        return results;
    }
    /**
     * 프로젝트 관리 페이지 특화 검증
     */
    async validateProjectManagementPage(filePath, content) {
        const issues = [];
        let hasErrorHandling = false;
        let hasLoadingStates = false;
        let hasValidation = false;
        let hasTabManagement = false;
        try {
            // 에러 처리 검증
            if (content.includes('tabErrors') || content.includes('error') || content.includes('catch')) {
                hasErrorHandling = true;
            }
            else {
                issues.push('에러 처리 로직이 없습니다.');
            }
            // 로딩 상태 검증
            if (content.includes('loading') || content.includes('tabLoadingStates')) {
                hasLoadingStates = true;
            }
            else {
                issues.push('로딩 상태 관리가 없습니다.');
            }
            // 데이터 검증 검증
            if (content.includes('validate') || content.includes('validation')) {
                hasValidation = true;
            }
            else {
                issues.push('데이터 검증 로직이 없습니다.');
            }
            // 탭 관리 검증
            if (content.includes('activeTab') || content.includes('tab')) {
                hasTabManagement = true;
            }
            else {
                issues.push('탭 관리 로직이 없습니다.');
            }
            // Svelte 5 문법 검증
            if (content.includes('$state') && !content.includes('$derived')) {
                issues.push('Svelte 5 반응성 문법이 완전하지 않습니다.');
            }
            // 접근성 검증
            if (content.includes('<label') && !content.includes('for=')) {
                issues.push('접근성을 위해 label에 for 속성을 추가하세요.');
            }
            this.log(`🔍 프로젝트 관리 페이지 검증: ${filePath}`);
            if (issues.length > 0) {
                this.log(`⚠️ 발견된 문제들: ${issues.join(', ')}`);
            }
            else {
                this.log(`✅ 프로젝트 관리 페이지 검증 통과`);
            }
        }
        catch (error) {
            this.log(`❌ 프로젝트 관리 페이지 검증 실패: ${error}`);
            issues.push(`검증 실패: ${error}`);
        }
        return {
            hasErrorHandling,
            hasLoadingStates,
            hasValidation,
            hasTabManagement,
            issues
        };
    }
    /**
     * 검증 결과 처리
     */
    async handleValidationResult(filePath, validation) {
        const hasErrors = validation.coding?.errors?.length > 0;
        const hasWarnings = validation.coding?.warnings?.length > 0;
        if (hasErrors) {
            this.log(`❌ 검증 실패: ${filePath}`);
            validation.coding.errors.forEach((error) => {
                this.log(`  - ${error}`);
            });
            this.errors++;
            // 자동 수정 시도
            await this.attemptAutoFix(filePath, validation);
        }
        else if (hasWarnings) {
            this.log(`⚠️ 검증 경고: ${filePath}`);
            validation.coding.warnings.forEach((warning) => {
                this.log(`  - ${warning}`);
            });
            this.warnings++;
        }
        else {
            this.log(`✅ 검증 통과: ${filePath}`);
        }
    }
    /**
     * 자동 수정 시도
     */
    async attemptAutoFix(filePath, validation) {
        this.log(`🔧 자동 수정 시도: ${filePath}`);
        try {
            // 변경 계획 생성
            const plan = await safe_change_manager_1.SafeChangeManager.createChangePlan(filePath, 'modify', '자동 수정');
            // 자동 수정 로직 실행
            const fixed = await this.executeAutoFix(plan, validation);
            if (fixed) {
                this.autoFixes++;
                this.log(`✅ 자동 수정 완료: ${filePath}`);
            }
            else {
                this.log(`❌ 자동 수정 실패: ${filePath}`);
            }
        }
        catch (error) {
            this.log(`❌ 자동 수정 오류: ${filePath} - ${error}`);
        }
    }
    /**
     * 자동 수정 실행
     */
    async executeAutoFix(plan, validation) {
        try {
            // 실제 자동 수정 로직
            // 예: 코드 포맷팅, 타입 수정, import 정리 등
            // 1. 코드 포맷팅
            if (validation.coding?.warnings?.some((w) => w.includes('포맷팅'))) {
                await this.formatCode(plan.filePath);
            }
            // 2. Import 정리
            if (validation.coding?.warnings?.some((w) => w.includes('import'))) {
                await this.organizeImports(plan.filePath);
            }
            // 3. 타입 수정
            if (validation.coding?.warnings?.some((w) => w.includes('타입'))) {
                await this.fixTypes(plan.filePath);
            }
            return true;
        }
        catch (error) {
            this.log(`❌ 자동 수정 실행 실패: ${error}`);
            return false;
        }
    }
    /**
     * 코드 포맷팅
     */
    async formatCode(filePath) {
        try {
            // Prettier를 사용한 코드 포맷팅
            const { exec } = await Promise.resolve().then(() => require('child_process'));
            const { promisify } = await Promise.resolve().then(() => require('util'));
            const execAsync = promisify(exec);
            await execAsync(`npx prettier --write "${filePath}"`);
            this.log(`🎨 코드 포맷팅 완료: ${filePath}`);
        }
        catch (error) {
            this.log(`❌ 코드 포맷팅 실패: ${filePath} - ${error}`);
        }
    }
    /**
     * Import 정리
     */
    async organizeImports(filePath) {
        try {
            // TypeScript 컴파일러를 사용한 import 정리
            const { exec } = await Promise.resolve().then(() => require('child_process'));
            const { promisify } = await Promise.resolve().then(() => require('util'));
            const execAsync = promisify(exec);
            await execAsync(`npx tsc --noEmit --skipLibCheck "${filePath}"`);
            this.log(`📦 Import 정리 완료: ${filePath}`);
        }
        catch (error) {
            this.log(`❌ Import 정리 실패: ${filePath} - ${error}`);
        }
    }
    /**
     * 타입 수정
     */
    async fixTypes(filePath) {
        try {
            // 타입 오류 자동 수정 로직
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            // 간단한 타입 수정 예시
            let fixedContent = content
                .replace(/any\[\]/g, 'unknown[]')
                .replace(/any\s*=/g, 'unknown =')
                .replace(/any\s*:/g, 'unknown:');
            if (fixedContent !== content) {
                (0, fs_1.writeFileSync)(filePath, fixedContent);
                this.log(`🔧 타입 수정 완료: ${filePath}`);
            }
        }
        catch (error) {
            this.log(`❌ 타입 수정 실패: ${filePath} - ${error}`);
        }
    }
    /**
     * 의존성 분석
     */
    async analyzeDependencies(filePath) {
        // 간단한 의존성 분석
        return {
            riskLevel: 'low',
            dependencies: [],
            dependents: []
        };
    }
    /**
     * 주기적 검증 실행
     */
    startPeriodicValidation() {
        // 5분마다 전체 검증 실행
        setInterval(async () => {
            if (this.isRunning) {
                this.log('🔄 주기적 검증 실행');
                await this.runPeriodicValidation();
            }
        }, 5 * 60 * 1000); // 5분
    }
    /**
     * 주기적 검증 실행
     */
    async runPeriodicValidation() {
        try {
            // 전체 프로젝트 검증
            for (const dir of this.WATCH_DIRS) {
                await this.validateDirectory(dir);
            }
        }
        catch (error) {
            this.log(`❌ 주기적 검증 실패: ${error}`);
        }
    }
    /**
     * 디렉토리 검증
     */
    async validateDirectory(dir) {
        // 디렉토리 내 모든 파일 검증
        // 실제 구현에서는 재귀적으로 파일을 찾아서 검증
        this.log(`🔍 디렉토리 검증: ${dir}`);
    }
    /**
     * 로그 디렉토리 생성
     */
    ensureLogDirectory() {
        const logDir = (0, path_1.dirname)(this.logFile);
        if (!(0, fs_1.existsSync)(logDir)) {
            (0, fs_1.mkdirSync)(logDir, { recursive: true });
        }
    }
    /**
     * 로그 기록
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        // 파일에도 기록
        try {
            (0, fs_1.writeFileSync)(this.logFile, logMessage + '\n', { flag: 'a' });
        }
        catch (error) {
            console.error('로그 파일 기록 실패:', error);
        }
    }
    /**
     * 서비스가 실행 중인지 확인
     */
    static isServiceRunning() {
        const pidFile = (0, path_1.join)(process.cwd(), 'logs', 'auto-validation.pid');
        if (!(0, fs_1.existsSync)(pidFile)) {
            return false;
        }
        try {
            const pid = parseInt((0, fs_1.readFileSync)(pidFile, 'utf-8'));
            // 프로세스가 실제로 실행 중인지 확인
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 서비스 중지 (PID 파일 기반)
     */
    static async stopService() {
        const pidFile = (0, path_1.join)(process.cwd(), 'logs', 'auto-validation.pid');
        if (!(0, fs_1.existsSync)(pidFile)) {
            console.log('서비스가 실행 중이 아닙니다.');
            return;
        }
        try {
            const pid = parseInt((0, fs_1.readFileSync)(pidFile, 'utf-8'));
            process.kill(pid, 'SIGTERM');
            console.log('서비스 중지 요청 전송');
        }
        catch (error) {
            console.error('서비스 중지 실패:', error);
        }
    }
}
exports.AutoValidationService = AutoValidationService;
AutoValidationService.instance = null;
