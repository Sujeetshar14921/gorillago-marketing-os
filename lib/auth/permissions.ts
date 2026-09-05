export const PERMISSIONS = {
  super_admin: [
    'organizations:manage',
    'members:manage',
    'billing:manage',
    'settings:manage',
    'products:manage',
    'campaigns:manage',
    'content:manage',
    'media:manage',
    'analytics:view',
    'ads:manage',
    'integrations:manage',
    'ai:manage',
  ],
  agency_owner: [
    'organizations:manage',
    'members:manage',
    'billing:manage',
    'settings:manage',
    'products:manage',
    'campaigns:manage',
    'content:manage',
    'media:manage',
    'analytics:view',
    'ads:manage',
    'integrations:manage',
    'ai:manage',
  ],
  business_owner: [
    'members:manage',
    'billing:manage',
    'settings:manage',
    'products:manage',
    'campaigns:manage',
    'content:manage',
    'media:manage',
    'analytics:view',
    'ads:manage',
    'integrations:manage',
    'ai:manage',
  ],
  marketing_manager: [
    'products:manage',
    'campaigns:manage',
    'content:manage',
    'media:manage',
    'analytics:view',
    'ads:manage',
    'ai:manage',
  ],
  content_manager: [
    'products:view',
    'content:manage',
    'media:manage',
    'analytics:view',
  ],
  viewer: [
    'products:view',
    'analytics:view',
  ],
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type Role = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role] as readonly string[];
  return perms.includes(permission);
}

export function canManage(role: Role): boolean {
  return ['super_admin', 'agency_owner', 'business_owner', 'marketing_manager'].includes(role);
}

export function isAdmin(role: Role): boolean {
  return ['super_admin', 'agency_owner', 'business_owner'].includes(role);
}
