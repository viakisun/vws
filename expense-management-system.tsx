import React, { useState, useEffect } from 'react';
import { Upload, FileText, DollarSign, Users, Calendar, CheckCircle, AlertTriangle, Download, Eye, X, Search, Filter, Plus, ChevronDown, Menu, Bell, User, LogOut } from 'lucide-react';

const ExpenseManagementSystem = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('2025Q3');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 분기별 할당량 데이터
  const quarterBudgets = {
    '2025Q3': {
      labor: { allocated: 150000000, used: 89500000, cash: 67000000, inkind: 22500000 },
      materials: { allocated: 80000000, used: 45600000 },
      research: { allocated: 45000000, used: 28900000 },
      travel: { allocated: 25000000, used: 18200000 }
    },
    '2025Q4': {
      labor: { allocated: 160000000, used: 12000000, cash: 9000000, inkind: 3000000 },
      materials: { allocated: 85000000, used: 8500000 },
      research: { allocated: 50000000, used: 7200000 },
      travel: { allocated: 30000000, used: 4500000 }
    }
  };

  // 증빙자료 데이터
  const [documents, setDocuments] = useState([
    {
      id: 1, category: 'labor_cash', subcategory: 'payroll', title: '김연구원 8월 급여명세서',
      uploadedBy: '경영지원팀', uploadDate: '2025-09-05', amount: 4500000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['급여명세서', '근로계약서', '4대보험가입확인서']
    },
    {
      id: 2, category: 'labor_cash', subcategory: 'contract', title: '김연구원 근로계약서 (2025년)',
      uploadedBy: '경영지원팀', uploadDate: '2025-09-05', amount: 0, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['근로계약서']
    },
    {
      id: 3, category: 'labor_cash', subcategory: 'insurance', title: '김연구원 4대보험 가입확인서',
      uploadedBy: '경영지원팀', uploadDate: '2025-09-05', amount: 0, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['4대보험가입확인서']
    },
    {
      id: 4, category: 'labor_cash', subcategory: 'attendance', title: '김연구원 8월 근태관리대장',
      uploadedBy: '경영지원팀', uploadDate: '2025-09-05', amount: 0, status: 'approved',
      quarter: '2025Q3', fileType: 'Excel', approver: '연구소장', requiredDocs: ['근태관리대장']
    },
    {
      id: 5, category: 'labor_cash', subcategory: 'participation', title: '김연구원 연구참여확인서',
      uploadedBy: '연구소장', uploadDate: '2025-09-05', amount: 0, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '경영지원팀', requiredDocs: ['연구참여확인서']
    },
    {
      id: 6, category: 'labor_inkind', subcategory: 'equipment_usage', title: '이박사 연구장비 사용료 산정서',
      uploadedBy: '연구원', uploadDate: '2025-09-03', amount: 2800000, status: 'pending',
      quarter: '2025Q3', fileType: 'Excel', approver: null, requiredDocs: ['장비사용료산정서', '장비구입영수증', '감가상각계산서']
    },
    {
      id: 7, category: 'labor_inkind', subcategory: 'facility_usage', title: '연구실 임대료 산정서 (8월)',
      uploadedBy: '경영지원팀', uploadDate: '2025-09-03', amount: 1500000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['임대료산정서', '임대차계약서']
    },
    {
      id: 8, category: 'materials', subcategory: 'equipment', title: '센서 부품 구매 영수증',
      uploadedBy: '연구소장', uploadDate: '2025-09-01', amount: 1200000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '경영지원팀', requiredDocs: ['세금계산서', '통장사본', '구매요청서']
    },
    {
      id: 9, category: 'materials', subcategory: 'consumables', title: '실험용 소모품 구매영수증',
      uploadedBy: '연구원', uploadDate: '2025-08-30', amount: 450000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['세금계산서', '통장사본']
    },
    {
      id: 10, category: 'research', subcategory: 'conference', title: '국제학회 참가비',
      uploadedBy: '연구원', uploadDate: '2025-08-28', amount: 850000, status: 'rejected',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['등록비영수증', '학회프로그램', '참가확인서']
    },
    {
      id: 11, category: 'research', subcategory: 'publication', title: 'SCI 논문게재료',
      uploadedBy: '연구원', uploadDate: '2025-08-25', amount: 1200000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '연구소장', requiredDocs: ['논문게재료영수증', '논문원고', '게재확인서']
    },
    {
      id: 12, category: 'travel', subcategory: 'domestic', title: '부산 기술세미나 출장비',
      uploadedBy: '연구원', uploadDate: '2025-09-10', amount: 180000, status: 'pending',
      quarter: '2025Q3', fileType: 'PDF', approver: null, requiredDocs: ['출장신청서', '교통비영수증', '숙박비영수증', '출장보고서']
    },
    {
      id: 13, category: 'travel', subcategory: 'international', title: '일본 로봇전시회 출장비',
      uploadedBy: '연구소장', uploadDate: '2025-09-08', amount: 1850000, status: 'approved',
      quarter: '2025Q3', fileType: 'PDF', approver: '경영지원팀', requiredDocs: ['출장신청서', '항공료영수증', '숙박비영수증', '일비정산서', '출장보고서', '여권사본']
    }
  ]);

  // 카테고리 설정
  const categories = {
    'all': '전체',
    'labor_cash': '인건비(현금)',
    'labor_inkind': '인건비(현물)',
    'materials': '재료비',
    'research': '연구활동비',
    'travel': '출장비'
  };

  const subcategories = {
    'payroll': '급여명세서', 'contract': '근로계약서', 'insurance': '4대보험',
    'attendance': '근태관리', 'participation': '연구참여확인',
    'equipment_usage': '장비사용료', 'facility_usage': '시설사용료',
    'equipment': '장비/기기', 'consumables': '소모품',
    'conference': '학회참가', 'publication': '논문게재', 'patent': '특허출원', 'external_service': '외부용역',
    'domestic': '국내출장', 'international': '국외출장'
  };

  const departments = {
    'all': '전체 부서',
    '경영지원팀': '경영지원팀',
    '연구소장': '연구소장',
    '연구원': '연구원'
  };

  const statusOptions = {
    'all': '전체 상태',
    'pending': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };

  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'approved': 'bg-green-100 text-green-800 border-green-200',
    'rejected': 'bg-red-100 text-red-800 border-red-200'
  };

  // 필터링된 문서
  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
    const departmentMatch = selectedDepartment === 'all' || doc.uploadedBy === selectedDepartment;
    const quarterMatch = doc.quarter === selectedQuarter;
    const statusMatch = selectedStatus === 'all' || doc.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && departmentMatch && quarterMatch && statusMatch && searchMatch;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const currentBudget = quarterBudgets[selectedQuarter];

  const handleUpload = (category) => {
    setUploadCategory(category);
    setShowUploadModal(true);
  };

  const formatAmount = (amount) => {
    return `${(amount / 10000).toLocaleString()}만원`;
  };

  const calculateUsageRate = (used, allocated) => {
    return Math.round((used / allocated) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 md:ml-0 text-xl font-semibold text-gray-900">
                연구개발 증빙자료 관리
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-500 relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">알림</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 rounded-md">
                          <p className="text-sm text-yellow-800">이박사 연구장비 사용료 승인 대기중</p>
                          <p className="text-xs text-yellow-600 mt-1">2시간 전</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-md">
                          <p className="text-sm text-red-800">국제학회 참가비 반려됨</p>
                          <p className="text-xs text-red-600 mt-1">1일 전</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button className="flex items-center text-sm rounded-full bg-white p-1 hover:bg-gray-50">
                  <User className="h-8 w-8 text-gray-400" />
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 컨트롤 바 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 필터 섹션 */}
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">분기</label>
                <select 
                  value={selectedQuarter} 
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="2025Q3">2025년 3분기</option>
                  <option value="2025Q4">2025년 4분기</option>
                </select>
              </div>
              
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(categories).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                <select 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(departments).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-0 flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(statusOptions).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 검색 및 액션 */}
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="문서명, 업로드자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                증빙자료 업로드
              </button>
            </div>
          </div>
        </div>

        {/* 예산 현황 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 인건비 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">인건비</h3>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">사용률</span>
                  <span className="font-semibold text-gray-900">
                    {calculateUsageRate(currentBudget.labor.used, currentBudget.labor.allocated)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(calculateUsageRate(currentBudget.labor.used, currentBudget.labor.allocated), 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatAmount(currentBudget.labor.used)}</span>
                  <span>{formatAmount(currentBudget.labor.allocated)}</span>
                </div>
              </div>
              
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">현금</span>
                  <span className="font-medium">{formatAmount(currentBudget.labor.cash)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">현물</span>
                  <span className="font-medium">{formatAmount(currentBudget.labor.inkind)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-3">
                <button 
                  onClick={() => handleUpload('labor_cash')}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors"
                >
                  현금 증빙
                </button>
                <button 
                  onClick={() => handleUpload('labor_inkind')}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors"
                >
                  현물 증빙
                </button>
              </div>
            </div>
          </div>

          {/* 재료비 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">재료비</h3>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">사용률</span>
                  <span className="font-semibold text-gray-900">
                    {calculateUsageRate(currentBudget.materials.used, currentBudget.materials.allocated)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(calculateUsageRate(currentBudget.materials.used, currentBudget.materials.allocated), 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatAmount(currentBudget.materials.used)}</span>
                  <span>{formatAmount(currentBudget.materials.allocated)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleUpload('materials')}
                className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors mt-8"
              >
                재료비 증빙 업로드
              </button>
            </div>
          </div>

          {/* 연구활동비 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">연구활동비</h3>
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">사용률</span>
                  <span className="font-semibold text-gray-900">
                    {calculateUsageRate(currentBudget.research.used, currentBudget.research.allocated)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(calculateUsageRate(currentBudget.research.used, currentBudget.research.allocated), 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatAmount(currentBudget.research.used)}</span>
                  <span>{formatAmount(currentBudget.research.allocated)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleUpload('research')}
                className="w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors mt-8"
              >
                연구활동비 증빙 업로드
              </button>
            </div>
          </div>

          {/* 출장비 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">출장비</h3>
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">사용률</span>
                  <span className="font-semibold text-gray-900">
                    {calculateUsageRate(currentBudget.travel.used, currentBudget.travel.allocated)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(calculateUsageRate(currentBudget.travel.used, currentBudget.travel.allocated), 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatAmount(currentBudget.travel.used)}</span>
                  <span>{formatAmount(currentBudget.travel.allocated)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleUpload('travel')}
                className="w-full bg-orange-50 text-orange-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 transition-colors mt-8"
              >
                출장비 증빙 업로드
              </button>
            </div>
          </div>
        </div>

        {/* 증빙자료 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">증빙자료 목록</h2>
                <p className="text-sm text-gray-600 mt-1">
                  총 {filteredDocuments.length}건의 증빙자료 (전체 {documents.length}건 중)
                </p>
              </div>
              <div className="text-sm text-gray-500">
                페이지 {currentPage} / {totalPages}
              </div>
            </div>
          </div>
          
          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업로드자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업로드일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FileText className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {doc.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {doc.fileType} • {subcategories[doc.subcategory]}
                          </div>
                          {doc.requiredDocs && (
                            <div className="text-xs text-blue-600 mt-1 truncate">
                              필수: {doc.requiredDocs.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{categories[doc.category]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{doc.uploadedBy}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {doc.amount > 0 ? formatAmount(doc.amount) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[doc.status]}`}>
                        {statusOptions[doc.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(doc.uploadDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="미리보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 빈 상태 메시지 */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">증빙자료가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                선택한 조건에 맞는 증빙자료가 없습니다. 필터를 조정해보세요.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 증빙자료 업로드
                </button>
              </div>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && filteredDocuments.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDocuments.length)} / {filteredDocuments.length}건 표시
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            page === currentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 업로드 모달 */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">증빙자료 업로드</h3>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리: {uploadCategory ? categories[uploadCategory] : '선택해주세요'}
                  </label>
                  {!uploadCategory && (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(categories).slice(1).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setUploadCategory(key)}
                          className="p-3 text-left border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900">{value}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {uploadCategory && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-800 mb-3">
                        {categories[uploadCategory]} 필수 증빙서류:
                      </p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {uploadCategory === 'labor_cash' && (
                          <>
                            <div>• 급여명세서 (매월)</div>
                            <div>• 근로계약서 (연간)</div>
                            <div>• 4대보험 가입확인서 (연간)</div>
                            <div>• 근태관리대장 (매월)</div>
                            <div>• 연구참여확인서 (분기별)</div>
                          </>
                        )}
                        {uploadCategory === 'labor_inkind' && (
                          <>
                            <div>• 장비사용료 산정서</div>
                            <div>• 장비구입 영수증</div>
                            <div>• 감가상각 계산서</div>
                            <div>• 시설임대료 산정서</div>
                            <div>• 임대차 계약서</div>
                          </>
                        )}
                        {uploadCategory === 'travel' && (
                          <>
                            <div>• 출장신청서 (사전 승인)</div>
                            <div>• 교통비 영수증</div>
                            <div>• 숙박비 영수증</div>
                            <div>• 일비 정산서</div>
                            <div>• 출장보고서 (사후 제출)</div>
                            <div>• 국외출장 시: 여권사본, 항공료영수증</div>
                          </>
                        )}
                        {uploadCategory === 'materials' && (
                          <>
                            <div>• 세금계산서</div>
                            <div>• 통장사본 (입금확인)</div>
                            <div>• 구매요청서 (사전 승인)</div>
                            <div>• 납품확인서</div>
                          </>
                        )}
                        {uploadCategory === 'research' && (
                          <>
                            <div>• 학회참가: 등록비영수증, 학회프로그램, 참가확인서</div>
                            <div>• 논문게재: 게재료영수증, 논문원고, 게재확인서</div>
                            <div>• 특허출원: 특허출원서, 출원비영수증</div>
                            <div>• 외부용역: 용역계약서, 결과보고서, 세금계산서</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {uploadCategory && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        세부 카테고리
                      </label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        {uploadCategory === 'labor_cash' && (
                          <>
                            <option value="payroll">급여명세서</option>
                            <option value="contract">근로계약서</option>
                            <option value="insurance">4대보험가입확인서</option>
                            <option value="attendance">근태관리대장</option>
                            <option value="participation">연구참여확인서</option>
                          </>
                        )}
                        {uploadCategory === 'labor_inkind' && (
                          <>
                            <option value="equipment_usage">장비사용료</option>
                            <option value="facility_usage">시설사용료</option>
                          </>
                        )}
                        {uploadCategory === 'materials' && (
                          <>
                            <option value="equipment">장비/기기</option>
                            <option value="consumables">소모품</option>
                          </>
                        )}
                        {uploadCategory === 'research' && (
                          <>
                            <option value="conference">학회참가</option>
                            <option value="publication">논문게재</option>
                            <option value="patent">특허출원</option>
                            <option value="external_service">외부용역</option>
                          </>
                        )}
                        {uploadCategory === 'travel' && (
                          <>
                            <option value="domestic">국내출장</option>
                            <option value="international">국외출장</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        문서 제목
                      </label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="증빙자료 제목을 입력하세요"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        금액 (원)
                      </label>
                      <input 
                        type="number" 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="금액을 입력하세요 (해당없음 시 0)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        파일 업로드
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-1">파일을 드래그하거나 클릭하여 업로드</p>
                        <p className="text-xs text-gray-400">PDF, Excel, Word 파일만 가능 (최대 10MB)</p>
                        <button className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-colors">
                          파일 선택
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    disabled={!uploadCategory}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    업로드
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagementSystem;