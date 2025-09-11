import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Calendar, Users, DollarSign, Target, FileText, Eye, Edit, Plus, Download, Filter, ChevronRight, ChevronDown, Activity, Zap, Award } from 'lucide-react';

// Mock Project Data
const mockProjects = [
  {
    id: "VIA-25Q2-DEV01",
    title: "SaaS 관제 아키텍처 설계",
    type: "DEV",
    year: 2025,
    quarter: 2,
    status: "Done",
    priority: "High",
    progress: 100,
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    actualEndDate: "2025-06-20",
    ownerOrg: "VIA",
    partnerOrgs: ["KIRO"],
    budget: {
      total: 50000000,
      personnel: 45000000,
      equipment: 3000000,
      materials: 2000000,
      spent: 46750000,
      remaining: 3250000
    },
    personnel: [
      { name: "김철수", role: "연구책임자", participation: 100, cost: 31250000 },
      { name: "정수진", role: "시스템 아키텍트", participation: 70, cost: 15291668 }
    ],
    kpis: [
      { id: "KPI-STAGE1-01", name: "인식 정확도", target: 0.90, current: 0.91, achieved: true },
      { id: "KPI-STAGE1-02", name: "작업 성공률", target: 0.85, current: 0.87, achieved: true }
    ],
    deliverables: [
      { name: "아키텍처 설계서", status: "완료", dueDate: "2025-03-31", completedDate: "2025-03-25" },
      { name: "프로토타입 구현", status: "완료", dueDate: "2025-06-30", completedDate: "2025-06-20" }
    ],
    risks: [
      { level: "Low", description: "일정 지연 없음" }
    ]
  },
  {
    id: "VIA-26Q1-DEV02",
    title: "클라우드 통합 관제 모듈",
    type: "DEV",
    year: 2026,
    quarter: 1,
    status: "InProgress",
    priority: "High",
    progress: 75,
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    actualEndDate: null,
    ownerOrg: "VIA",
    partnerOrgs: ["METAFARMERS", "NAAS"],
    budget: {
      total: 80000000,
      personnel: 72000000,
      equipment: 5000000,
      materials: 3000000,
      spent: 54000000,
      remaining: 26000000
    },
    personnel: [
      { name: "김철수", role: "공동연구원", participation: 80, cost: 15000000 },
      { name: "박민수", role: "AI 개발자", participation: 60, cost: 32400000 }
    ],
    kpis: [
      { id: "KPI-STAGE1-02", name: "작업 성공률", target: 0.85, current: 0.82, achieved: false },
      { id: "KPI-STAGE2-01", name: "실증 성공률", target: 0.90, current: 0.0, achieved: false }
    ],
    deliverables: [
      { name: "모듈 설계", status: "완료", dueDate: "2026-01-31", completedDate: "2026-01-28" },
      { name: "API 개발", status: "진행중", dueDate: "2026-02-28", completedDate: null },
      { name: "통합 테스트", status: "예정", dueDate: "2026-03-31", completedDate: null }
    ],
    risks: [
      { level: "Medium", description: "외부 API 의존성 이슈" },
      { level: "Low", description: "성능 최적화 필요" }
    ]
  },
  {
    id: "UXUI-25-01",
    title: "FarmFlow 운영설계 UXUI",
    type: "UXUI",
    year: 2025,
    quarter: 4,
    status: "Done",
    priority: "Medium",
    progress: 100,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    actualEndDate: "2025-12-15",
    ownerOrg: "VIA",
    partnerOrgs: [],
    budget: {
      total: 25000000,
      personnel: 22000000,
      equipment: 1500000,
      materials: 1500000,
      spent: 22000000,
      remaining: 3000000
    },
    personnel: [
      { name: "이영희", role: "UI/UX 디자이너", participation: 100, cost: 20000000 }
    ],
    kpis: [
      { id: "KPI-STAGE1-01", name: "인식 정확도", target: 0.90, current: 0.88, achieved: false }
    ],
    deliverables: [
      { name: "UI 설계", status: "완료", dueDate: "2025-10-31", completedDate: "2025-10-25" },
      { name: "프로토타입", status: "완료", dueDate: "2025-12-31", completedDate: "2025-12-15" }
    ],
    risks: [
      { level: "Low", description: "사용성 테스트 완료" }
    ]
  },
  {
    id: "VIA-26Q2-DEV03",
    title: "AI 기반 작물 인식 알고리즘",
    type: "DEV",
    year: 2026,
    quarter: 2,
    status: "Delayed",
    priority: "High",
    progress: 45,
    startDate: "2025-11-01",
    endDate: "2026-06-15",
    actualEndDate: null,
    ownerOrg: "VIA",
    partnerOrgs: ["UNIST"],
    budget: {
      total: 60000000,
      personnel: 55000000,
      equipment: 3000000,
      materials: 2000000,
      spent: 35100000,
      remaining: 24900000
    },
    personnel: [
      { name: "박민수", role: "AI 알고리즘 개발자", participation: 60, cost: 32400000 }
    ],
    kpis: [
      { id: "KPI-STAGE1-01", name: "인식 정확도", target: 0.90, current: 0.75, achieved: false }
    ],
    deliverables: [
      { name: "데이터 수집", status: "완료", dueDate: "2025-12-31", completedDate: "2025-12-20" },
      { name: "모델 개발", status: "지연", dueDate: "2026-03-31", completedDate: null },
      { name: "성능 최적화", status: "예정", dueDate: "2026-06-15", completedDate: null }
    ],
    risks: [
      { level: "High", description: "데이터 품질 이슈로 모델 성능 저하" },
      { level: "Medium", description: "일정 지연으로 인한 예산 초과 가능성" }
    ]
  },
  {
    id: "UXUI-26-01",
    title: "스마트팜 로봇 통합관제 UXUI",
    type: "UXUI",
    year: 2026,
    quarter: 2,
    status: "Planned",
    priority: "Medium",
    progress: 10,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    actualEndDate: null,
    ownerOrg: "VIA",
    partnerOrgs: ["KIRO", "NAAS"],
    budget: {
      total: 35000000,
      personnel: 30000000,
      equipment: 3000000,
      materials: 2000000,
      spent: 3500000,
      remaining: 31500000
    },
    personnel: [
      { name: "이영희", role: "UI/UX 리드", participation: 90, cost: 13500000 }
    ],
    kpis: [
      { id: "KPI-STAGE2-01", name: "실증 성공률", target: 0.90, current: 0.0, achieved: false }
    ],
    deliverables: [
      { name: "요구사항 분석", status: "진행중", dueDate: "2026-04-15", completedDate: null },
      { name: "UI 설계", status: "예정", dueDate: "2026-05-31", completedDate: null },
      { name: "프로토타입", status: "예정", dueDate: "2026-06-30", completedDate: null }
    ],
    risks: [
      { level: "Medium", description: "다기관 협업으로 인한 의사결정 지연 가능성" }
    ]
  }
];

const organizations = [
  { id: "VIA", name: "주식회사 비아", type: "기업" },
  { id: "METAFARMERS", name: "메타파머스", type: "기업" },
  { id: "KIRO", name: "한국로봇융합연구원", type: "연구소" },
  { id: "NAAS", name: "국립농업과학원", type: "정부기관" },
  { id: "UNIST", name: "울산과학기술원", type: "대학" }
];

// Utility functions
const formatCurrency = (amount: number) => {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`;
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}천만원`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`;
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Planned': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'InProgress': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Done': return 'bg-green-100 text-green-800 border-green-200';
    case 'Delayed': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800 border-red-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'High': return 'text-red-600 bg-red-50';
    case 'Medium': return 'text-yellow-600 bg-yellow-50';
    case 'Low': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getDaysFromNow = (dateString: string) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Components
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    Planned: { label: '계획됨', icon: '📋' },
    InProgress: { label: '진행중', icon: '⚡' },
    Done: { label: '완료', icon: '✅' },
    Delayed: { label: '지연', icon: '⚠️' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Planned;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(status)}`}>
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(priority)}`}>
    {priority}
  </span>
);

const ProgressBar = ({ progress, height = 'h-2' }: { progress: number; height?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full ${height}`}>
    <div 
      className={`${height} rounded-full transition-all duration-500 ${
        progress === 100 ? 'bg-green-500' : 
        progress >= 75 ? 'bg-blue-500' : 
        progress >= 50 ? 'bg-yellow-500' : 
        progress >= 25 ? 'bg-orange-500' : 'bg-red-500'
      }`}
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const BudgetProgressBar = ({ spent, total }: { spent: number; total: number }) => {
  const percentage = (spent / total) * 100;
  const isOverBudget = percentage > 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{formatCurrency(spent)}</span>
        <span className={`font-medium ${isOverBudget ? 'text-red-600' : percentage > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isOverBudget ? 'bg-red-500' : 
            percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      {isOverBudget && (
        <div className="text-xs text-red-600 font-medium">
          예산 초과: {formatCurrency(spent - total)}
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, onClick }: { project: any; onClick: () => void }) => {
  const daysToEnd = project.endDate ? getDaysFromNow(project.endDate) : 0;
  const isUrgent = daysToEnd <= 30 && daysToEnd > 0 && project.status !== 'Done';
  const isOverdue = daysToEnd < 0 && project.status !== 'Done';
  
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-mono text-sm text-gray-600">{project.id}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              project.type === 'DEV' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {project.type}
            </span>
            <PriorityBadge priority={project.priority} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{project.year}년 {project.quarter}분기</span>
            <span>{project.ownerOrg}</span>
            {project.partnerOrgs.length > 0 && <span>+{project.partnerOrgs.length} 협력</span>}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
          </div>
          <ProgressBar progress={project.progress} />
        </div>

        {/* Budget */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">예산 집행</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(project.budget.total)}</span>
          </div>
          <BudgetProgressBar spent={project.budget.spent} total={project.budget.total} />
        </div>

        {/* Timeline */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">일정</span>
          <div className="text-right">
            {project.status === 'Done' ? (
              <span className="text-green-600 font-medium">
                {project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString('ko-KR') : '완료'}
              </span>
            ) : (
              <span className={`font-medium ${
                isOverdue ? 'text-red-600' : isUrgent ? 'text-yellow-600' : 'text-gray-700'
              }`}>
                {project.endDate ? new Date(project.endDate).toLocaleDateString('ko-KR') : 'TBD'}
                {isOverdue && <span className="ml-1">({Math.abs(daysToEnd)}일 지연)</span>}
                {isUrgent && <span className="ml-1">({daysToEnd}일 남음)</span>}
              </span>
            )}
          </div>
        </div>

        {/* Personnel */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">참여 인력</span>
          <span className="font-medium">{project.personnel.length}명</span>
        </div>

        {/* Risks */}
        {project.risks.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-600">리스크 {project.risks.length}건</span>
              <div className="flex space-x-1">
                {project.risks.map((risk, index) => (
                  <span key={index} className={`w-2 h-2 rounded-full ${
                    risk.level === 'High' ? 'bg-red-500' : 
                    risk.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const ProjectOverviewDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [timeRange, setTimeRange] = useState('2026');

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const projects = mockProjects;
    
    const statusCounts = {
      planned: projects.filter(p => p.status === 'Planned').length,
      inProgress: projects.filter(p => p.status === 'InProgress').length,
      done: projects.filter(p => p.status === 'Done').length,
      delayed: projects.filter(p => p.status === 'Delayed').length
    };

    const totalBudget = projects.reduce((sum, p) => sum + p.budget.total, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);
    const budgetUtilization = (totalSpent / totalBudget) * 100;

    const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length;

    const upcomingDeadlines = projects
      .filter(p => p.endDate && p.status !== 'Done')
      .map(p => ({ ...p, daysToEnd: getDaysFromNow(p.endDate!) }))
      .filter(p => p.daysToEnd <= 30 && p.daysToEnd > 0)
      .sort((a, b) => a.daysToEnd - b.daysToEnd);

    const overdueProjects = projects
      .filter(p => p.endDate && p.status !== 'Done')
      .map(p => ({ ...p, daysOverdue: Math.abs(getDaysFromNow(p.endDate!)) }))
      .filter(p => getDaysFromNow(p.endDate!) < 0);

    const totalPersonnel = projects.reduce((sum, p) => sum + p.personnel.length, 0);
    const totalKPIs = projects.reduce((sum, p) => sum + p.kpis.length, 0);
    const achievedKPIs = projects.reduce((sum, p) => sum + p.kpis.filter(k => k.achieved).length, 0);

    const riskProjects = projects.filter(p => p.risks.some(r => r.level === 'High' || r.level === 'Medium'));

    return {
      statusCounts,
      totalBudget,
      totalSpent,
      budgetUtilization,
      avgProgress,
      upcomingDeadlines,
      overdueProjects,
      totalPersonnel,
      totalKPIs,
      achievedKPIs,
      riskProjects,
      totalProjects: projects.length
    };
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      if (filterStatus && project.status !== filterStatus) return false;
      if (filterType && project.type !== filterType) return false;
      if (filterOrg && project.ownerOrg !== filterOrg && !project.partnerOrgs.includes(filterOrg)) return false;
      if (timeRange && project.year.toString() !== timeRange) return false;
      return true;
    });
  }, [filterStatus, filterType, filterOrg, timeRange]);

  const openProjectDetail = (project: any) => {
    setSelectedProject(project);
    setShowProjectDetail(true);
  };

  const closeProjectDetail = () => {
    setShowProjectDetail(false);
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">프로젝트 현황 대시보드</h1>
                <p className="mt-1 text-sm text-gray-500">
                  전체 연구개발 프로젝트 통합 모니터링 및 관리
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 연도</option>
                  <option value="2025">2025년</option>
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                </select>
                
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-2" />
                  리포트 생성
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  새 프로젝트
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">전체 프로젝트</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardMetrics.totalProjects}개</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="grid grid-cols-4 gap-1 text-xs text-center">
                <div className="text-blue-600">{dashboardMetrics.statusCounts.planned} 계획</div>
                <div className="text-amber-600">{dashboardMetrics.statusCounts.inProgress} 진행</div>
                <div className="text-green-600">{dashboardMetrics.statusCounts.done} 완료</div>
                <div className="text-red-600">{dashboardMetrics.statusCounts.delayed} 지연</div>
              </div>
            </div>
          </div>

          {/* Budget Utilization */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">예산 집행률</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardMetrics.budgetUtilization.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-gray-900">{formatCurrency(dashboardMetrics.totalSpent)}</span>
                <span className="text-gray-500"> / {formatCurrency(dashboardMetrics.totalBudget)}</span>
              </div>
            </div>
          </div>

          {/* Average Progress */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">평균 진행률</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboardMetrics.avgProgress.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <ProgressBar progress={dashboardMetrics.avgProgress} height="h-2" />
            </div>
          </div>

          {/* KPI Achievement */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">KPI 달성률</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardMetrics.totalKPIs > 0 ? ((dashboardMetrics.achievedKPIs / dashboardMetrics.totalKPIs) * 100).toFixed(1) : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">{dashboardMetrics.achievedKPIs}개 달성</span>
                <span className="text-gray-500"> / {dashboardMetrics.totalKPIs}개 총계</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Section */}
        {(dashboardMetrics.upcomingDeadlines.length > 0 || dashboardMetrics.overdueProjects.length > 0 || dashboardMetrics.riskProjects.length > 0) && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">주의 사항</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upcoming Deadlines */}
                {dashboardMetrics.upcomingDeadlines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                      임박한 마감일 ({dashboardMetrics.upcomingDeadlines.length}건)
                    </h3>
                    <div className="space-y-2">
                      {dashboardMetrics.upcomingDeadlines.slice(0, 3).map((project) => (
                        <div key={project.id} className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="font-medium text-gray-900">{project.title}</div>
                          <div className="text-yellow-700">{project.daysToEnd}일 후 마감</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue Projects */}
                {dashboardMetrics.overdueProjects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                      지연 프로젝트 ({dashboardMetrics.overdueProjects.length}건)
                    </h3>
                    <div className="space-y-2">
                      {dashboardMetrics.overdueProjects.slice(0, 3).map((project) => (
                        <div key={project.id} className="text-sm bg-red-50 border border-red-200 rounded p-2">
                          <div className="font-medium text-gray-900">{project.title}</div>
                          <div className="text-red-700">{project.daysOverdue}일 지연</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Projects */}
                {dashboardMetrics.riskProjects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                      리스크 관리 필요 ({dashboardMetrics.riskProjects.length}건)
                    </h3>
                    <div className="space-y-2">
                      {dashboardMetrics.riskProjects.slice(0, 3).map((project) => (
                        <div key={project.id} className="text-sm bg-orange-50 border border-orange-200 rounded p-2">
                          <div className="font-medium text-gray-900">{project.title}</div>
                          <div className="text-orange-700">
                            {project.risks.filter(r => r.level === 'High').length > 0 ? '높음' : '중간'} 위험도
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 상태</option>
                <option value="Planned">계획됨</option>
                <option value="InProgress">진행중</option>
                <option value="Done">완료</option>
                <option value="Delayed">지연</option>
              </select>

              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 타입</option>
                <option value="DEV">DEV</option>
                <option value="UXUI">UXUI</option>
              </select>

              <select 
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 기관</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>

              {(filterStatus || filterType || filterOrg) && (
                <button
                  onClick={() => {
                    setFilterStatus('');
                    setFilterType('');
                    setFilterOrg('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  필터 초기화
                </button>
              )}

              <span className="text-sm text-gray-500">
                {filteredProjects.length}개 프로젝트 표시
              </span>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => openProjectDetail(project)}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">조건에 맞는 프로젝트가 없습니다</h3>
            <p className="text-sm text-gray-500">필터를 조정하거나 새 프로젝트를 추가해보세요.</p>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <div 
          className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 overflow-y-auto"
          onClick={closeProjectDetail}
        >
          <div 
            className="min-h-screen px-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-block align-middle bg-white rounded-lg shadow-xl transform transition-all my-8 max-w-4xl w-full">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                    <div className="flex items-center space-x-4 mt-1 text-blue-100">
                      <span className="font-mono">{selectedProject.id}</span>
                      <span>{selectedProject.year}년 {selectedProject.quarter}분기</span>
                      <span>{selectedProject.ownerOrg}</span>
                    </div>
                  </div>
                  <button
                    onClick={closeProjectDetail}
                    className="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Project Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">프로젝트 개요</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">상태:</span>
                          <div className="mt-1"><StatusBadge status={selectedProject.status} /></div>
                        </div>
                        <div>
                          <span className="text-gray-500">우선순위:</span>
                          <div className="mt-1"><PriorityBadge priority={selectedProject.priority} /></div>
                        </div>
                        <div>
                          <span className="text-gray-500">시작일:</span>
                          <div className="font-medium">{new Date(selectedProject.startDate).toLocaleDateString('ko-KR')}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">종료일:</span>
                          <div className="font-medium">{new Date(selectedProject.endDate).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">예산 현황</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">총 예산</span>
                            <span className="text-lg font-bold">{formatCurrency(selectedProject.budget.total)}</span>
                          </div>
                          <BudgetProgressBar spent={selectedProject.budget.spent} total={selectedProject.budget.total} />
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">인건비:</span>
                            <div className="font-medium">{formatCurrency(selectedProject.budget.personnel)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">장비비:</span>
                            <div className="font-medium">{formatCurrency(selectedProject.budget.equipment)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">재료비:</span>
                            <div className="font-medium">{formatCurrency(selectedProject.budget.materials)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personnel */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">참여 인력</h3>
                      <div className="space-y-3">
                        {selectedProject.personnel.map((person: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{person.name}</div>
                              <div className="text-sm text-gray-500">{person.role}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{person.participation}% 참여</div>
                              <div className="text-sm text-gray-500">{formatCurrency(person.cost)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Progress */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">진행 현황</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">전체 진행률</span>
                          <span className="text-2xl font-bold text-blue-600">{selectedProject.progress}%</span>
                        </div>
                        <ProgressBar progress={selectedProject.progress} height="h-3" />
                      </div>
                    </div>

                    {/* KPIs */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">KPI 현황</h3>
                      <div className="space-y-3">
                        {selectedProject.kpis.map((kpi: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{kpi.name}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                kpi.achieved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {kpi.achieved ? '달성' : '미달성'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              목표: {(kpi.target * 100).toFixed(1)}% / 현재: {(kpi.current * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">산출물 현황</h3>
                      <div className="space-y-2">
                        {selectedProject.deliverables.map((deliverable: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                            <span className="text-sm font-medium text-gray-900">{deliverable.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              deliverable.status === '완료' ? 'bg-green-100 text-green-800' :
                              deliverable.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                              deliverable.status === '지연' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {deliverable.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risks */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">리스크 관리</h3>
                      <div className="space-y-2">
                        {selectedProject.risks.map((risk: any, index: number) => (
                          <div key={index} className={`p-3 rounded-lg border ${getRiskColor(risk.level)}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{risk.level} 위험</span>
                            </div>
                            <div className="text-sm">{risk.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    리포트 생성
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    프로젝트 편집
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverviewDashboard;