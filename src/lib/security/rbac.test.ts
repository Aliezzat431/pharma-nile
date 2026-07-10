import { hasPermission, getNavRoutes, UserRole, Permission } from './rbac';

describe('PharmaNile RBAC Security Matrix Tests', () => {
  
  describe('Permission Verification', () => {
    test('developer role has all permissions', () => {
      const allPermissions: Permission[] = [
        'chain:read', 'chain:write', 'pharmacies:create', 'pharmacy:settings', 'pharmacy:backup',
        'staff:read', 'staff:write', 'pos:checkout', 'pos:refund', 'inventory:read', 'inventory:write',
        'inventory:cost_price', 'invoices:read', 'invoices:write', 'financials:read',
        'customers:read', 'customers:write', 'customers:debt_settle', 'transfers:read', 'transfers:write', 'transfers:approve'
      ];
      for (const permission of allPermissions) {
        expect(hasPermission('developer', permission)).toBe(true);
      }
    });

    test('chain_admin cannot read/write pharmacy details', () => {
      // Chain admins manage chains, not individual branch stores
      expect(hasPermission('chain_admin', 'chain:read')).toBe(true);
      expect(hasPermission('chain_admin', 'pharmacies:create')).toBe(true);
      
      expect(hasPermission('chain_admin', 'pos:checkout')).toBe(false);
      expect(hasPermission('chain_admin', 'inventory:read')).toBe(false);
      expect(hasPermission('chain_admin', 'financials:read')).toBe(false);
      expect(hasPermission('chain_admin', 'staff:write')).toBe(false);
    });

    test('pharmacy admin has all branch level permissions', () => {
      expect(hasPermission('admin', 'pharmacy:settings')).toBe(true);
      expect(hasPermission('admin', 'staff:write')).toBe(true);
      expect(hasPermission('admin', 'inventory:cost_price')).toBe(true);
      expect(hasPermission('admin', 'financials:read')).toBe(true);
      expect(hasPermission('admin', 'transfers:approve')).toBe(true);
      
      // But admin does not manage chains
      expect(hasPermission('admin', 'chain:write')).toBe(false);
      expect(hasPermission('admin', 'pharmacies:create')).toBe(false);
    });

    test('manager has branch operations but no sensitive settings/payroll control', () => {
      expect(hasPermission('manager', 'pos:checkout')).toBe(true);
      expect(hasPermission('manager', 'inventory:read')).toBe(true);
      expect(hasPermission('manager', 'inventory:write')).toBe(true);
      expect(hasPermission('manager', 'customers:debt_settle')).toBe(true);
      
      expect(hasPermission('manager', 'pharmacy:settings')).toBe(false);
      expect(hasPermission('manager', 'pharmacy:backup')).toBe(false);
      expect(hasPermission('manager', 'inventory:cost_price')).toBe(false); // only admin can see purchase margins
      expect(hasPermission('manager', 'staff:write')).toBe(false);
    });

    test('staff only has POS checkout and inventory viewing capabilities', () => {
      expect(hasPermission('staff', 'pos:checkout')).toBe(true);
      expect(hasPermission('staff', 'inventory:read')).toBe(true);
      expect(hasPermission('staff', 'customers:read')).toBe(true);
      
      expect(hasPermission('staff', 'inventory:write')).toBe(false);
      expect(hasPermission('staff', 'financials:read')).toBe(false);
      expect(hasPermission('staff', 'pos:refund')).toBe(false); // manager/admin only
    });

    test('undefined or empty role has no permissions', () => {
      expect(hasPermission(undefined, 'pos:checkout')).toBe(false);
      expect(hasPermission('' as any, 'pos:checkout')).toBe(false);
    });
  });

  describe('Route Protection Filtering', () => {
    test('chain_admin only sees home and settings navigation routes', () => {
      const routes = getNavRoutes('chain_admin');
      expect(routes.map(r => r.path)).toEqual(['/', '/settings']);
    });

    test('staff is blocked from settings, financials, staff, and returns routes', () => {
      const routes = getNavRoutes('staff');
      const paths = routes.map(r => r.path);
      
      expect(paths).toContain('/pos');
      expect(paths).toContain('/inventory');
      
      expect(paths).not.toContain('/financials');
      expect(paths).not.toContain('/staff');
      expect(paths).not.toContain('/returns');
    });

    test('admin has access to returns, staff, financials, settings', () => {
      const routes = getNavRoutes('admin');
      const paths = routes.map(r => r.path);
      
      expect(paths).toContain('/pos');
      expect(paths).toContain('/inventory');
      expect(paths).toContain('/financials');
      expect(paths).toContain('/staff');
      expect(paths).toContain('/returns');
      expect(paths).toContain('/settings');
    });
  });
});
