import React, { useState, useMemo } from 'react';
import { Users, DollarSign, Calendar, Plus, Edit, Trash2, Download, Upload, AlertTriangle, CheckCircle, Clock, TrendingUp, User, Building, Calculator, FileText, Eye, Search, Filter, Settings, Bell, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

// Mock Budget Data
const projectBudgets = {
  "VIA-25Q2-DEV01": {
    totalBudget: 50000000,
    personnelBudget: 45000000,
    현금Budget: 30000000,
    현물Budget: 15000000,
    quarterlyBudgets: {
      "2025-Q1": 27000000,
      "2025-Q2": 18000000
    }
  },
  "VIA-26Q1-DEV02": {
    totalBudget: 80000000,
    personnelBudget: 72000000,
    현금Budget: 50000000,
    현물Budget: 22000000,
    quarterlyBudgets: {
      "2026-Q1": 72000000
    }
  },
  "UXUI-25-01": {
    totalBudget: 25000000,
    personnelBudget: 22000000,
    현금Budget: 5000000,
    현물Budget: 17000000,
    quarterlyBudgets: {
      "2025-Q3": 7000000,
      "2025-Q4": 15000000
    }
  },
  "UXUI-26-01": {
    totalBudget: 35000000,
    personnelBudget: 30000000,
    현금Budget: 25000000,
    현물Budget: 5000000,
    quarterlyBudgets: {
      "2026-Q2": 30000000
    }
  },
  "VIA-26Q2-DEV03": {
    totalBudget: 60000000,
    personnelBudget: 55000000,
    현금Budget: 20000000,
    현물Budget: 35000000,
    quarterlyBudgets: {
      "2025-Q4": 10000000,
      "2026-Q1": 20000000,
      "2026-Q2": 25000000
    }
  },
  "UXUI-26-02": {
    totalBudget: 40000000,
    personnelBudget: 35000000,
    현금Budget: 10000000,
    현물Budget: 25000000,
    quarterlyBudgets: {
      "2026-Q1": 15000000,
      "2026-Q2": 15000000,
      "2026-Q3": 5000000
    }
  }
};

// Alert thresholds
const alertThresholds = {
  budget_warning: 0.8,
  budget_critical: 0.95,
  budget_over: 1.0,
  resignation_warning: 30,
  new_hire_notice: 7
};

// Mock Personnel Data
const mockPersonnel = [
  {
    id: "EMP-001",
    name: "김철수",
    position: "책임연구원",
    department: "로봇기술팀",
    organization: "VIA",
    employeeId: "VIA-2023-001",
    email: "kim.cs@via.co.kr",
    phone: "010-1234-5678",
    hireDate: "2023-03-15",
    resignationDate: null,
    status: "active" as const,
    salaryType: "annual" as const,
    annualSalary: 75000000,
    monthlySalary: 6250000,
    photoUrl: null,
    participations: [
      {
        projectId: "VIA-25Q2-DEV01",
        projectTitle: "SaaS 관제 아키텍처 설계",
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        participationRate: 100,
        costType: "현금" as const,
        role: "연구책임자",
        totalCost: 31250000,
        quarterlyBreakdown: {
          "2025-Q1": 18750000,
          "2025-Q2": 12500000
        }
      },
      {
        projectId: "VIA-26Q1-DEV02",
        projectTitle: "클라우드 통합 관제 모듈",
        startDate: "2026-01-01", 
        endDate: "2026-03-31",
        participationRate: 80,
        costType: "현금" as const,
        role: "공동연구원",
        totalCost: 15000000,
        quarterlyBreakdown: {
          "2026-Q1": 15000000
        }
      }
    ]
  },
  {
    id: "EMP-002",
    name: "이영희",
    position: "선임연구원",
    department: "UXUI팀",
    organization: "VIA",
    employeeId: "VIA-2022-015",
    email: "lee.yh@via.co.kr",
    phone: "010-2345-6789",
    hireDate: "2022-08-01",
    resignationDate: null,
    status: "active" as const,
    salaryType: "annual" as const,
    annualSalary: 60000000,
    monthlySalary: 5000000,
    photoUrl: null,
    participations: [
      {
        projectId: "UXUI-25-01",
        projectTitle: "FarmFlow 운영설계 UXUI",
        startDate: "2025-09-01",
        endDate: "2025-12-31",
        participationRate: 100,
        costType: "현물" as const,
        role: "UI/UX 디자이너",
        totalCost: 20000000,
        quarterlyBreakdown: {
          "2025-Q3": 5000000,
          "2025-Q4": 15000000
        }
      },
      {
        projectId: "UXUI-26-01",
        projectTitle: "스마트팜 로봇 통합관제 UXUI",
        startDate: "2026-04-01",
        endDate: "2026-06-30",
        participationRate: 90,
        costType: "현금" as const,
        role: "UI/UX 리드",
        totalCost: 13500000,
        quarterlyBreakdown: {
          "2026-Q2": 13500000
        }
      }
    ]
  },
  {
    id: "EMP-003",
    name: "박민수",
    position: "연구원",
    department: "AI연구팀",
    organization: "UNIST",
    employeeId: "UNIST-2024-007",
    email: "park.ms@unist.ac.kr",
    phone: "010-3456-7890",
    hireDate: "2024-02-01",
    resignationDate: null,
    status: "active" as const,
    salaryType: "project" as const,
    projectBasedRate: 450000,
    participations: [
      {
        projectId: "VIA-26Q2-DEV03",
        projectTitle: "AI 기반 작물 인식 알고리즘",
        startDate: "2025-11-01",
        endDate: "2026-06-15",
        participationRate: 60,
        costType: "현물" as const,
        role: "AI 알고리즘 개발자",
        totalCost: 48600000,
        quarterlyBreakdown: {
          "2025-Q4": 5400000,
          "2026-Q1": 16200000,
          "2026-Q2": 27000000
        }
      }
    ]
  },
  {
    id: "EMP-004",
    name: "정수진",
    position: "주임연구원",
    department: "로봇제어팀",
    organization: "KIRO",
    employeeId: "KIRO-2023-012",
    email: "jung.sj@kiro.re.kr",
    phone: "010-4567-8901",
    hireDate: "2023-07-01",
    resignationDate: "2026-03-31",
    status: "resignation_scheduled" as const,
    salaryType: "annual" as const,
    annualSalary: 65000000,
    monthlySalary: 5416667,
    participations: [
      {
        projectId: "VIA-25Q2-DEV01",
        projectTitle: "SaaS 관제 아키텍처 설계",
        startDate: "2025-03-01",
        endDate: "2025-06-30",
        participationRate: 70,
        costType: "현물" as const,
        role: "시스템 아키텍트",
        totalCost: 15291668,
        quarterlyBreakdown: {
          "2025-Q1": 3790834,
          "2025-Q2": 11500834
        }
      }
    ]
  },
  {
    id: "EMP-005",
    name: "최동혁",
    position: "선임연구원",
    department: "데이터사이언스팀",
    organization: "NAAS",
    employeeId: "NAAS-2025-003",
    email: "choi.dh@korea.kr",
    phone: "010-5678-9012",
    hireDate: "2025-11-01",
    resignationDate: null,
    status: "new_hire" as const,
    salaryType: "annual" as const,
    annualSalary: 58000000,
    monthlySalary: 4833333,
    participations: [
      {
        projectId: "UXUI-26-02",
        projectTitle: "스마트팜 데이터 분석·리포팅 UXUI",
        startDate: "2026-01-01",
        endDate: "2026-09-30",
        participationRate: 85,
        costType: "현물" as const,
        role: "데이터 분석가",
        totalCost: 29399999,
        quarterlyBreakdown: {
          "2026-Q1": 12266666,
          "2026-Q2": 12266666,
          "2026-Q3": 4866667
        }
      }
    ]
  }
];

const organizations = [
  { id: "VIA", name: "주식회사 비아", type: "기업" },
  { id: "METAFARMERS", name: "메타파머스", type: "기업" },
  { id: "KIRO", name: "한국로봇융합연구원", type: "연구소" },
  { id: "DAEDONG", name: "대동로보틱스", type: "기업" },
  { id: "NAAS", name: "국립농업과학원", type: "정부기관" },
  { id: "UNIST", name: "울산과학기술원", type: "대학" },
  { id: "AGE", name: "에이지로보틱스", type: "기업" }
];

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
  if (amount >= 100000000) { // 1억 이상
    return `${(amount / 100000000).toFixed(1)}억원`;
  } else if (amount >= 10000000) { // 1천만 이상
    return `${(amount / 10000000).toFixed(1)}천만원`;
  } else if (amount >= 10000) { // 1만 이상
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return formatCurrency(amount);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'resignation_scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'new_hire': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'resigned': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCostTypeColor = (costType: string) => {
  switch (costType) {
    case '현금': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case '현물': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDaysFromNow = (dateString: string) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Components
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: { label: '재직', icon: '●' },
    resignation_scheduled: { label: '퇴사예정', icon: '⚠' },
    new_hire: { label: '신입', icon: '★' },
    resigned: { label: '퇴사', icon: '○' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getStatusColor(status)}`}>
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </span>
  );
};

const CostTypeBadge = ({ costType }: { costType: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getCostTypeColor(costType)}`}>
    {costType}
  </span>
);

const BudgetProgressBar = ({ utilized, budget, height = 'h-2', showPercentage = true }: { 
  utilized: number; 
  budget: number; 
  height?: string;
  showPercentage?: boolean;
}) => {
  const utilizationRate = budget > 0 ? utilized / budget : 0;
  const percentage = Math.min(utilizationRate * 100, 100);
  
  const getColorClass = () => {
    if (utilizationRate >= alertThresholds.budget_over) return 'bg-red-500';
    if (utilizationRate >= alertThresholds.budget_critical) return 'bg-orange-500';
    if (utilizationRate >= alertThresholds.budget_warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (utilizationRate >= alertThresholds.budget_over) return '초과';
    if (utilizationRate >= alertThresholds.budget_critical) return '위험';
    if (utilizationRate >= alertThresholds.budget_warning) return '주의';
    return '정상';
  };

  return (
    <div className="space-y-1">
      {showPercentage && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">
            {formatCompactCurrency(utilized)} / {formatCompactCurrency(budget)}
          </span>
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${
              utilizationRate >= alertThresholds.budget_critical ? 'text-red-600' : 
              utilizationRate >= alertThresholds.budget_warning ? 'text-orange-600' : 'text-green-600'
            }`}>
              {percentage.toFixed(1)}%
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              utilizationRate >= alertThresholds.budget_critical ? 'bg-red-100 text-red-700' : 
              utilizationRate >= alertThresholds.budget_warning ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div 
          className={`${height} rounded-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      {utilizationRate > 1 && (
        <div className="text-xs text-red-600 font-medium">
          예산 초과: {formatCompactCurrency(utilized - budget)}
        </div>
      )}
    </div>
  );
};

const AlertCard = ({ alert }: { alert: any }) => {
  const getAlertStyle = () => {
    switch (alert.severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = () => {
    switch (alert.severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getAlertStyle()}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${getIconColor()}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{alert.message}</div>
          <div className="text-xs text-gray-600 mt-1">{alert.details}</div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const PersonnelCostManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCostType, setFilterCostType] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('2026-Q1');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Calculate budget utilization and alerts
  const budgetAnalysis = useMemo(() => {
    const projectAnalysis = new Map();
    const alerts = [];

    // Calculate project-wise budget utilization
    Object.entries(projectBudgets).forEach(([projectId, budget]) => {
      const projectCosts = mockPersonnel.reduce((costs, person) => {
        const participation = person.participations.find(p => p.projectId === projectId);
        if (participation) {
          costs.total += participation.totalCost;
          costs[participation.costType] += participation.totalCost;
          
          Object.entries(participation.quarterlyBreakdown).forEach(([quarter, cost]) => {
            if (!costs.quarters[quarter]) costs.quarters[quarter] = 0;
            costs.quarters[quarter] += cost;
          });
        }
        return costs;
      }, { total: 0, 현금: 0, 현물: 0, quarters: {} });

      const utilizationRate = projectCosts.total / budget.personnelBudget;
      const 현금UtilizationRate = projectCosts.현금 / budget.현금Budget;
      const 현물UtilizationRate = projectCosts.현물 / budget.현물Budget;

      projectAnalysis.set(projectId, {
        budget,
        costs: projectCosts,
        utilizationRate,
        현금UtilizationRate,
        현물UtilizationRate,
        remaining: budget.personnelBudget - projectCosts.total,
        status: utilizationRate >= alertThresholds.budget_over ? 'over' :
                utilizationRate >= alertThresholds.budget_critical ? 'critical' :
                utilizationRate >= alertThresholds.budget_warning ? 'warning' : 'normal'
      });

      // Generate budget alerts
      if (utilizationRate >= alertThresholds.budget_over) {
        alerts.push({
          type: 'budget_over',
          severity: 'error',
          projectId,
          message: `${projectId} 인건비 예산 초과`,
          details: `${(utilizationRate * 100).toFixed(1)}% 소진 (${formatCompactCurrency(projectCosts.total - budget.personnelBudget)} 초과)`
        });
      } else if (utilizationRate >= alertThresholds.budget_critical) {
        alerts.push({
          type: 'budget_critical',
          severity: 'warning',
          projectId,
          message: `${projectId} 인건비 예산 위험`,
          details: `${(utilizationRate * 100).toFixed(1)}% 소진 (잔여: ${formatCompactCurrency(budget.personnelBudget - projectCosts.total)})`
        });
      } else if (utilizationRate >= alertThresholds.budget_warning) {
        alerts.push({
          type: 'budget_warning',
          severity: 'info',
          projectId,
          message: `${projectId} 인건비 예산 주의`,
          details: `${(utilizationRate * 100).toFixed(1)}% 소진 (잔여: ${formatCompactCurrency(budget.personnelBudget - projectCosts.total)})`
        });
      }
    });

    // Generate personnel alerts
    mockPersonnel.forEach(person => {
      if (person.status === 'resignation_scheduled' && person.resignationDate) {
        const daysUntilResignation = getDaysFromNow(person.resignationDate);
        if (daysUntilResignation <= alertThresholds.resignation_warning && daysUntilResignation > 0) {
          alerts.push({
            type: 'resignation_warning',
            severity: 'warning',
            personId: person.id,
            message: `${person.name} 퇴사 임박`,
            details: `${daysUntilResignation}일 후 퇴사 예정 (참여: ${person.participations.length}개 프로젝트)`
          });
        }
      }

      if (person.status === 'new_hire') {
        const daysSinceHire = Math.ceil((new Date().getTime() - new Date(person.hireDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceHire <= alertThresholds.new_hire_notice) {
          alerts.push({
            type: 'new_hire_notice',
            severity: 'info',
            personId: person.id,
            message: `${person.name} 신규 입사`,
            details: `${daysSinceHire}일 전 입사 (${person.organization} ${person.position})`
          });
        }
      }
    });

    const totalBudget = Object.values(projectBudgets).reduce((sum, b) => sum + b.personnelBudget, 0);
    const totalSpent = Array.from(projectAnalysis.values()).reduce((sum, p) => sum + p.costs.total, 0);
    const overallUtilization = totalSpent / totalBudget;

    return {
      projectAnalysis,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      totalBudget,
      totalSpent,
      overallUtilization
    };
  }, []);

  // Filtered personnel
  const filteredPersonnel = useMemo(() => {
    return mockPersonnel.filter(person => {
      if (searchTerm && !person.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !person.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterOrganization && person.organization !== filterOrganization) return false;
      if (filterStatus && person.status !== filterStatus) return false;
      if (filterCostType) {
        const hasMatchingCostType = person.participations.some(p => p.costType === filterCostType);
        if (!hasMatchingCostType) return false;
      }
      return true;
    });
  }, [searchTerm, filterOrganization, filterStatus, filterCostType]);

  // Calculate quarter costs
  const quarterCosts = useMemo(() => {
    return mockPersonnel.reduce((acc, person) => {
      person.participations.forEach(participation => {
        Object.entries(participation.quarterlyBreakdown).forEach(([quarter, cost]) => {
          if (!acc[quarter]) acc[quarter] = { 현금: 0, 현물: 0, total: 0, personnel: new Set() };
          acc[quarter][participation.costType] += cost;
          acc[quarter].total += cost;
          acc[quarter].personnel.add(person.id);
        });
      });
      return acc;
    }, {} as Record<string, { 현금: number; 현물: number; total: number; personnel: Set<string> }>);
  }, []);

  const currentQuarterCost = quarterCosts[selectedQuarter] || { 현금: 0, 현물: 0, total: 0, personnel: new Set() };

  const openPersonDetail = (person: any) => {
    setSelectedPerson(person);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedPerson(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'} flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">VIA R&D</h1>
                <p className="text-sm text-gray-500">인력관리 시스템</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Budget Overview */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">예산 현황</h2>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">전체 소진율</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {(budgetAnalysis.overallUtilization * 100).toFixed(1)}%
                    </span>
                  </div>
                  <BudgetProgressBar 
                    utilized={budgetAnalysis.totalSpent} 
                    budget={budgetAnalysis.totalBudget}
                    showPercentage={false}
                    height="h-2"
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    잔여: {formatCompactCurrency(budgetAnalysis.totalBudget - budgetAnalysis.totalSpent)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCompactCurrency(currentQuarterCost.현금)}
                    </div>
                    <div className="text-xs text-emerald-700">현금</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCompactCurrency(currentQuarterCost.현물)}
                    </div>
                    <div className="text-xs text-blue-700">현물</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {budgetAnalysis.alerts.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">알림</h2>
                  <span className="flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                    {budgetAnalysis.alerts.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {budgetAnalysis.alerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className={`p-2 rounded text-xs border ${
                      alert.severity === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                      alert.severity === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                      'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-xs opacity-75 mt-1">{alert.details}</div>
                    </div>
                  ))}
                  {budgetAnalysis.alerts.length > 5 && (
                    <div className="text-center">
                      <button className="text-xs text-blue-600 hover:text-blue-800">
                        +{budgetAnalysis.alerts.length - 5}개 더보기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">인력 통계</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{mockPersonnel.length}</div>
                  <div className="text-xs text-gray-500">전체</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {mockPersonnel.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-500">재직</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {mockPersonnel.filter(p => p.status === 'new_hire').length}
                  </div>
                  <div className="text-xs text-gray-500">신입</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {mockPersonnel.filter(p => p.status === 'resignation_scheduled').length}
                  </div>
                  <div className="text-xs text-gray-500">퇴사예정</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">인력 및 인건비 관리</h1>
              <p className="text-sm text-gray-500 mt-1">연구원 참여 현황 및 인건비 산정 관리</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select 
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2025-Q3">2025년 3분기</option>
                  <option value="2025-Q4">2025년 4분기</option>
                  <option value="2026-Q1">2026년 1분기</option>
                  <option value="2026-Q2">2026년 2분기</option>
                  <option value="2026-Q3">2026년 3분기</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="w-4 h-4 mr-2" />
                  일괄등록
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-2" />
                  엑셀 다운로드
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  인력 추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="이름 또는 사번으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select 
              value={filterOrganization}
              onChange={(e) => setFilterOrganization(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 기관</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="active">재직</option>
              <option value="new_hire">신입</option>
              <option value="resignation_scheduled">퇴사예정</option>
            </select>

            <select 
              value={filterCostType}
              onChange={(e) => setFilterCostType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">비용구분</option>
              <option value="현금">현금</option>
              <option value="현물">현물</option>
            </select>

            {(searchTerm || filterOrganization || filterStatus || filterCostType) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterOrganization('');
                  setFilterStatus('');
                  setFilterCostType('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                필터 초기화
              </button>
            )}

            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filteredPersonnel.length}명 표시
            </span>
          </div>
        </div>

        {/* Personnel Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                      인력 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      소속 및 상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      급여 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">
                      참여 프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      {selectedQuarter} 인건비
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      예산 소진율
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPersonnel.map((person, index) => {
                    const quarterCost = person.participations.reduce((sum, p) => {
                      return sum + (p.quarterlyBreakdown[selectedQuarter] || 0);
                    }, 0);

                    const totalBudgetForPerson = person.participations.reduce((sum, p) => {
                      const budget = projectBudgets[p.projectId];
                      if (budget && budget.quarterlyBudgets[selectedQuarter]) {
                        const participationRatio = p.participationRate / 100;
                        return sum + (budget.quarterlyBudgets[selectedQuarter] * participationRatio);
                      }
                      return sum;
                    }, 0);

                    const utilizationRate = totalBudgetForPerson > 0 ? quarterCost / totalBudgetForPerson : 0;

                    return (
                      <tr 
                        key={person.id}
                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                        onClick={() => openPersonDetail(person)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                                {person.name.slice(0, 1)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900">{person.name}</div>
                              <div className="text-sm text-gray-600">{person.position}</div>
                              <div className="text-xs text-gray-500 font-mono">{person.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-900 font-medium">
                              {organizations.find(org => org.id === person.organization)?.name}
                            </div>
                            <div className="text-xs text-gray-600">{person.department}</div>
                            <StatusBadge status={person.status} />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCompactCurrency(person.annualSalary || person.projectBasedRate * 22 * 12)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {person.salaryType === 'annual' ? '연봉' : '프로젝트'}
                            </div>
                            {person.resignationDate && (
                              <div className="text-xs text-red-600">
                                {getDaysFromNow(person.resignationDate)}일 후 퇴사
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-900">
                              {person.participations.length}개 프로젝트 참여
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {person.participations.slice(0, 2).map((p, i) => (
                                <CostTypeBadge key={i} costType={p.costType} />
                              ))}
                              {person.participations.length > 2 && (
                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                  +{person.participations.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCompactCurrency(quarterCost)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {person.participations.filter(p => p.quarterlyBreakdown[selectedQuarter]).length > 0 
                                ? `${person.participations.filter(p => p.quarterlyBreakdown[selectedQuarter]).length}개 프로젝트`
                                : '참여 없음'
                              }
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="w-full">
                            <BudgetProgressBar 
                              utilized={quarterCost} 
                              budget={totalBudgetForPerson || 1}
                              height="h-1.5"
                              showPercentage={false}
                            />
                            <div className="text-xs text-center mt-1 font-medium">
                              {(utilizationRate * 100).toFixed(0)}%
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openPersonDetail(person);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              title="편집"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPersonnel.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">조건에 맞는 인력이 없습니다</h3>
                <p className="text-sm text-gray-500">필터를 조정하거나 새 인력을 추가해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {showDrawer && selectedPerson && (
        <div 
          className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50"
          onClick={closeDrawer}
        >
          <div 
            className="fixed inset-y-0 right-0 w-1/2 max-w-2xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold text-lg">
                      {selectedPerson.name.slice(0, 1)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedPerson.name}</h2>
                      <p className="text-blue-100">{selectedPerson.position} • {selectedPerson.organization}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">기본 정보</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">사번:</span>
                        <div className="font-medium font-mono">{selectedPerson.employeeId}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">이메일:</span>
                        <div className="font-medium">{selectedPerson.email}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">전화번호:</span>
                        <div className="font-medium">{selectedPerson.phone}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">입사일:</span>
                        <div className="font-medium">{new Date(selectedPerson.hireDate).toLocaleDateString('ko-KR')}</div>
                      </div>
                      {selectedPerson.resignationDate && (
                        <div className="col-span-2">
                          <span className="text-gray-500">퇴사예정일:</span>
                          <div className="font-medium text-red-600">
                            {new Date(selectedPerson.resignationDate).toLocaleDateString('ko-KR')} 
                            <span className="ml-2 text-sm">({getDaysFromNow(selectedPerson.resignationDate)}일 후)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Salary Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">급여 정보</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">급여 체계:</span>
                        <div className="font-medium">
                          {selectedPerson.salaryType === 'annual' ? '연봉제' : '프로젝트 기반'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {selectedPerson.salaryType === 'annual' ? '연봉:' : '일당:'}
                        </span>
                        <div className="font-medium">
                          {formatCurrency(selectedPerson.annualSalary || selectedPerson.projectBasedRate)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">월 환산액:</span>
                        <div className="font-medium text-lg">
                          {formatCurrency(selectedPerson.monthlySalary || selectedPerson.projectBasedRate * 22)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Participations */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">프로젝트 참여 현황</h3>
                    <div className="space-y-4">
                      {selectedPerson.participations.map((participation, index) => {
                        const budget = projectBudgets[participation.projectId];
                        const budgetInfo = budgetAnalysis.projectAnalysis.get(participation.projectId);
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">{participation.projectTitle}</h4>
                                <div className="text-sm text-gray-500 font-mono">{participation.projectId}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {participation.startDate} ~ {participation.endDate}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CostTypeBadge costType={participation.costType} />
                                {budgetInfo && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    budgetInfo.status === 'over' ? 'bg-red-100 text-red-700' :
                                    budgetInfo.status === 'critical' ? 'bg-orange-100 text-orange-700' :
                                    budgetInfo.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {budgetInfo.status === 'over' ? '예산초과' :
                                     budgetInfo.status === 'critical' ? '예산위험' :
                                     budgetInfo.status === 'warning' ? '예산주의' : '정상'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">역할:</span>
                                <div className="font-medium">{participation.role}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">참여율:</span>
                                <div className="font-medium">{participation.participationRate}%</div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">총 인건비</span>
                                <span className="text-lg font-bold text-gray-900">
                                  {formatCurrency(participation.totalCost)}
                                </span>
                              </div>
                              
                              {budget && (
                                <div className="mb-3">
                                  <div className="text-xs text-gray-500 mb-1">프로젝트 예산 대비</div>
                                  <BudgetProgressBar 
                                    utilized={participation.totalCost} 
                                    budget={budget.personnelBudget * (participation.participationRate / 100)} 
                                  />
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mb-1">분기별 세부내역:</div>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(participation.quarterlyBreakdown).map(([quarter, cost]) => (
                                  <div key={quarter} className="text-xs flex justify-between">
                                    <span className="text-gray-600">{quarter}:</span>
                                    <span className="font-medium">{formatCompactCurrency(cost)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">총 인건비 요약</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-indigo-600">
                          {formatCompactCurrency(selectedPerson.participations.reduce((sum, p) => sum + p.totalCost, 0))}
                        </div>
                        <div className="text-xs text-indigo-700">총 인건비</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-emerald-600">
                          {formatCompactCurrency(selectedPerson.participations.filter(p => p.costType === '현금').reduce((sum, p) => sum + p.totalCost, 0))}
                        </div>
                        <div className="text-xs text-emerald-700">현금</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatCompactCurrency(selectedPerson.participations.filter(p => p.costType === '현물').reduce((sum, p) => sum + p.totalCost, 0))}
                        </div>
                        <div className="text-xs text-blue-700">현물</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center">
                    <Edit className="w-4 h-4 mr-2" />
                    정보 수정
                  </button>
                  <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    프로젝트 추가
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" />
                    내역서 출력
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

export default PersonnelCostManagement;