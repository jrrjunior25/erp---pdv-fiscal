import type { UserRole, Permission } from '@types';

const permissions: Record<UserRole, Permission[]> = {
    ADMIN: [
        'view_dashboard',
        'manage_products',
        'manage_customers',
        'manage_suppliers',
        'view_reports',
        'manage_inventory',
        'manage_financials',
        'manage_users',
        'manage_purchasing',
    ],
    MANAGER: [
        'view_dashboard',
        'manage_products',
        'manage_customers',
        'manage_suppliers',
        'view_reports',
        'manage_inventory',
        'manage_financials',
        'manage_users',
        'manage_purchasing',
    ],
    CASHIER: [], // Cashier only has access to PDV, not any specific ERP modules
    USER: [],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
    // Admins and Managers have all permissions in this setup
    if (role === 'ADMIN' || role === 'MANAGER') return true;
    return permissions[role]?.includes(permission) || false;
};
