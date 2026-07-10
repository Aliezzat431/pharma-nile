

export type UserRole = 'chain_admin' | 'admin' | 'manager' | 'staff' | 'developer';

export type Permission =
  
  | 'chain:read'
  | 'chain:write'
  | 'pharmacies:create'
  
  
  | 'pharmacy:settings'
  | 'pharmacy:backup'
  
  
  | 'staff:read'
  | 'staff:write'
  
  
  | 'pos:checkout'
  | 'pos:refund'
  
  
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:cost_price' 
  
  
  | 'invoices:read'
  | 'invoices:write'
  
  
  | 'financials:read'
  
  
  | 'customers:read'
  | 'customers:write'
  | 'customers:debt_settle'
  
  
  | 'transfers:read'
  | 'transfers:write'
  | 'transfers:approve';


const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  developer: [
    'chain:read', 'chain:write', 'pharmacies:create', 'pharmacy:settings', 'pharmacy:backup',
    'staff:read', 'staff:write', 'pos:checkout', 'pos:refund', 'inventory:read', 'inventory:write',
    'inventory:cost_price', 'invoices:read', 'invoices:write', 'financials:read',
    'customers:read', 'customers:write', 'customers:debt_settle', 'transfers:read', 'transfers:write', 'transfers:approve'
  ],
  chain_admin: [
    'chain:read',
    'chain:write',
    'pharmacies:create',
    'pharmacy:settings' 
  ],
  admin: [
    'pharmacy:settings',
    'pharmacy:backup',
    'staff:read',
    'staff:write',
    'pos:checkout',
    'pos:refund',
    'inventory:read',
    'inventory:write',
    'inventory:cost_price',
    'invoices:read',
    'invoices:write',
    'financials:read',
    'customers:read',
    'customers:write',
    'customers:debt_settle',
    'transfers:read',
    'transfers:write',
    'transfers:approve'
  ],
  manager: [
    'staff:read',
    'pos:checkout',
    'pos:refund',
    'inventory:read',
    'inventory:write',
    'invoices:read',
    'invoices:write',
    'customers:read',
    'customers:write',
    'customers:debt_settle',
    'transfers:read',
    'transfers:write'
  ],
  staff: [
    'pos:checkout',
    'inventory:read',
    'customers:read',
    'customers:write',
    'transfers:read'
  ]
};


export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}


export interface NavItem {
  name: string;
  arabicName: string;
  path: string;
  permission?: Permission;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', arabicName: 'الرئيسية', path: '/' },
  { name: 'POS', arabicName: 'نقطة البيع', path: '/pos', permission: 'pos:checkout' },
  { name: 'Inventory', arabicName: 'المخزن', path: '/inventory', permission: 'inventory:read' },
  { name: 'Invoices', arabicName: 'الفواتير', path: '/invoices', permission: 'invoices:read' },
  { name: 'Returns', arabicName: 'المرتجعات', path: '/returns', permission: 'pos:refund' },
  { name: 'Customers', arabicName: 'العملاء والديون', path: '/customers', permission: 'customers:read' },
  { name: 'Financials', arabicName: 'الماليات', path: '/financials', permission: 'financials:read' },
  { name: 'Staff', arabicName: 'الموظفين', path: '/staff', permission: 'staff:read' },
  { name: 'Transfers', arabicName: 'تحويلات الفروع', path: '/transfers', permission: 'transfers:read' },
  { name: 'Settings', arabicName: 'الإعدادات', path: '/settings' }
];


export function getNavRoutes(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  
  if (role === 'chain_admin') {
    
    return [
      { name: 'Dashboard', arabicName: 'الرئيسية', path: '/' },
      { name: 'Settings', arabicName: 'إعدادات السلسلة', path: '/settings' }
    ];
  }

  return NAVIGATION_ITEMS.filter(item => {
    if (!item.permission) return true;
    return hasPermission(role, item.permission);
  });
}
