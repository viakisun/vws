/**
 * 리소스 아이콘 매핑
 * Svelte 컴포넌트를 사용하므로 브라우저 환경에서만 import
 */

import {
  BanknoteIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckSquareIcon,
  DollarSignIcon,
  FileCheckIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HelpCircleIcon,
  HomeIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  ShieldIcon,
  TargetIcon,
  UsersIcon,
} from 'lucide-svelte'
import type { ComponentType } from 'svelte'

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
  crm: BuildingIcon,
  assets: PackageIcon,
  'assets.physical': PackageIcon,
  'assets.ip': FileCheckIcon,
  'assets.certifications': FileTextIcon,
  'assets.requests': CalendarIcon,
  'assets.audit': CheckSquareIcon,
  reports: FileTextIcon,
  analytics: FlaskConicalIcon,
  settings: SettingsIcon,
  'admin.permissions': ShieldIcon,
  help: HelpCircleIcon,
}

/**
 * 리소스 키로 아이콘 가져오기
 */
export function getResourceIcon(key: string): ComponentType | undefined {
  return RESOURCE_ICONS[key]
}
