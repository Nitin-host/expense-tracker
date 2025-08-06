// src/utils/getIcon.js
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as FiIcons from 'react-icons/fi';
import * as BiIcons from 'react-icons/bi';
import * as AiIcons from 'react-icons/ai';
import * as GiIcons from 'react-icons/gi';
// import more icon packs as needed...

const iconPacks = {
    Fa: FaIcons,
    Md: MdIcons,
    Fi: FiIcons,
    Bi: BiIcons,
    Ai: AiIcons,
    Gi: GiIcons,
    // add other packs here
};

const getIconComponent = (iconName) => {
    if (!iconName || typeof iconName !== 'string') return null;

    // Extract prefix (first two letters) e.g. "Fa", "Md", "Fi"
    const packPrefix = iconName.slice(0, 2);

    // Select pack
    const pack = iconPacks[packPrefix];

    if (!pack) {
        console.warn(`Icon pack for prefix "${packPrefix}" not found.`);
        return null;
    }

    // Return icon component or null if not found
    return pack[iconName] || null;
};

export default getIconComponent;
