const mainMenu = [
    {
        id: 'home',
        title: 'Home',
        url: '/home',
        icon: 'FaHome',
        roles: ['user', 'admin', 'super_admin'],
    },
    {
        id: 'solution',
        title: 'Solution',
        url: '/solution',
        icon: 'FaFolderOpen',
        roles: ['user', 'admin', 'super_admin'],
    },
    {
        id: 'create-user',
        title: 'Create User',
        url: '/create-user',
        icon: 'FaUserPlus',
        roles: ['super_admin', 'admin'],
    },
    {
        id: 'logout',
        title: 'Logout',
        icon: 'FaSignOutAlt',
        roles: ['user', 'admin', 'super_admin'],
        action: true,
    },
];

const solutionCardSubMenu = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/solution/:id/dashboard',
        icon: 'FaTachometerAlt',
        roles: ['user', 'admin', 'super_admin'],
    },
    {
        id: 'collected-cash',
        title: 'Collected Cash',
        url: '/solution/:id/collected-cash',
        icon: 'FaFileInvoiceDollar',
        roles: ['user', 'admin', 'super_admin'],
    },
    {
        id: 'expense-data',
        title: 'Expense Data',
        url: '/solution/:id/expense-data',
        icon: 'FaTable',
        roles: ['user', 'admin', 'super_admin'],
    },
];

export { mainMenu, solutionCardSubMenu };
