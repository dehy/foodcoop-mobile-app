import { Navigation } from 'react-native-navigation';

export function registerScreens() {
    Navigation.registerComponent('News', () => require('../screens/News').default);
    Navigation.registerComponent('Settings', () => require('../screens/Settings').default);
    Navigation.registerComponent('Settings/About', () => require('../screens/Settings/About').default);
    Navigation.registerComponent('Settings/Maintenance', () => require('../screens/Settings/Maintenance').default);
    Navigation.registerComponent('Settings/Maintenance/Database', () => require('../screens/Settings/Maintenance/Database').default);
    Navigation.registerComponent('Settings/Maintenance/Cookies', () => require('../screens/Settings/Maintenance/Cookies').default);
    Navigation.registerComponent('Initializing', (sc) => require('../screens/Initializing').default);
    Navigation.registerComponent('Welcome', () => require('../screens/Welcome').default);
    Navigation.registerComponent('Scanner', () => require('../screens/Scanner').default);
    Navigation.registerComponent('Inventory/List', () => require('../screens/Inventory/List').default);
    Navigation.registerComponent('Inventory/New', () => require('../screens/Inventory/New').default);
    Navigation.registerComponent('Inventory/Show', () => require('../screens/Inventory/Show').default);
    Navigation.registerComponent('Inventory/Export', () => require('../screens/Inventory/Export').default);
}