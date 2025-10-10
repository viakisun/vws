/**
 * 리소스 아이콘 매핑
 * Svelte 컴포넌트를 사용하므로 브라우저 환경에서만 import
 */

import type { ComponentType } from 'svelte'
import {
  BanknoteIcon,
  BarChart3Icon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HomeIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
} from 'lucide-svelte'

/**
 * 리소스 키별 아이콘 매핑
 */
export const RESOURCE_ICONS: Record<string, ComponentType> = {
  'common.dashboard': HomeIcon,
  'common.calendar': CalendarIcon,
  'common.messages': MessageSquareIcon,
  finance: BanknoteIcon,
  'salary.management': DollarSignIcon,
  hr: UsersIcon,
  project: BriefcaseIcon,
  planner: TargetIcon,
  sales: BarChart3Icon,
  crm: BuildingIcon,
  reports: FileTextIcon,
  analytics: FlaskConicalIcon,
  settings: SettingsIcon,
  'admin.permissions': ShieldIcon,
}

/**
 * 리소스 키로 아이콘 가져오기
 */
export function getResourceIcon(key: string): ComponentType | undefined {
  return RESOURCE_ICONS[key]
}
