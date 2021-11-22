/* eslint-disable prettier/prettier */
import {Navigation} from 'react-native-navigation';

export function registerScreens(): void {
    Navigation.registerComponent('News/List', () => require('../screens/News/List').default);
    Navigation.registerComponent('News/Show', () => require('../screens/News/Show').default);
    Navigation.registerComponent('Plus', () => require('../screens/Plus').default);
    Navigation.registerComponent('Plus/About', () => require('../screens/Plus/About').default);
    Navigation.registerComponent('Plus/Maintenance', () => require('../screens/Plus/Maintenance').default);
    Navigation.registerComponent(
        'Plus/Maintenance/Database',
        () => require('../screens/Plus/Maintenance/Database').default,
    );
    Navigation.registerComponent(
        'Plus/Maintenance/Cookies',
        () => require('../screens/Plus/Maintenance/Cookies').default,
    );
    Navigation.registerComponent('Initializing', () => require('../screens/Initializing').default);
    Navigation.registerComponent('Welcome', () => require('../screens/Welcome').default);
    Navigation.registerComponent('Scanner', () => require('../screens/Scanner').default);
    Navigation.registerComponent('Lists/List', () => require('../screens/Lists/List').default);
    Navigation.registerComponent('Lists/NewStepType', () => require('../screens/Lists/NewStepType').default);
    Navigation.registerComponent('Lists/Inventory/New', () => require('../screens/Lists/Inventory/New').default);
    Navigation.registerComponent('Lists/Inventory/Show', () => require('../screens/Lists/Inventory/Show').default);
    Navigation.registerComponent('Lists/Inventory/Scan', () => require('../screens/Lists/Inventory/Scan').default);
    Navigation.registerComponent('Lists/Inventory/Export', () => require('../screens/Lists/Inventory/Export').default);
    Navigation.registerComponent('Lists/GoodsReceipt/New', () => require('../screens/Lists/GoodsReceipt/New').default);
    Navigation.registerComponent(
        'Lists/GoodsReceipt/Show',
        () => require('../screens/Lists/GoodsReceipt/Show').default,
    );
    Navigation.registerComponent(
        'Lists/GoodsReceipt/Scan',
        () => require('../screens/Lists/GoodsReceipt/Scan').default,
    );
    Navigation.registerComponent(
        'Lists/GoodsReceipt/Export',
        () => require('../screens/Lists/GoodsReceipt/Export').default,
    );
}
