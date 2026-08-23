import {
    FaHome,
    FaFolderOpen,
    FaUserPlus,
    FaSignOutAlt,
    FaTachometerAlt,
    FaFileInvoiceDollar,
    FaTable,
    FaChartBar,
} from 'react-icons/fa';

const ICONS = {
    FaHome,
    FaFolderOpen,
    FaUserPlus,
    FaSignOutAlt,
    FaTachometerAlt,
    FaFileInvoiceDollar,
    FaTable,
    FaChartBar,
};

const getIconComponent = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return null;
    return ICONS[iconName] || null;
};

export default getIconComponent;
