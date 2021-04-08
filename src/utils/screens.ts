import { Navigation } from 'react-native-navigation';

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
    Navigation.registerComponent('Inventory/List', () => require('../screens/Inventory/List').default);
    Navigation.registerComponent('Inventory/New', () => require('../screens/Inventory/New').default);
    Navigation.registerComponent('Inventory/Show', () => require('../screens/Inventory/Show').default);
    Navigation.registerComponent('Inventory/Export', () => require('../screens/Inventory/Export').default);
    Navigation.registerComponent('Lists/List', () => require('../screens/Lists/List').default);
    Navigation.registerComponent('Lists/NewStepType', () => require('../screens/Lists/NewStepType').default);
    Navigation.registerComponent('Lists/Inventory/New', () => require('../screens/Lists/Inventory/New').default);
    Navigation.registerComponent('Lists/NewStepGoodsReceipt', () => require('../screens/Lists/NewStepGoodsReceipt').default);
    Navigation.registerComponent('Lists/Inventory/Show', () => require('../screens/Lists/Inventory/Show').default);
    Navigation.registerComponent('Lists/Inventory/Scan', () => require('../screens/Lists/Inventory/Scan').default);
    Navigation.registerComponent('GoodsReceipt/List', () => require('../screens/GoodsReceipt/List').default);
    Navigation.registerComponent('GoodsReceipt/New', () => require('../screens/GoodsReceipt/New').default);
    Navigation.registerComponent('GoodsReceipt/Show', () => require('../screens/GoodsReceipt/Show').default);
    Navigation.registerComponent('GoodsReceipt/Scan', () => require('../screens/GoodsReceipt/Scan').default);
    Navigation.registerComponent('GoodsReceipt/Export', () => require('../screens/GoodsReceipt/Export').default);
}
