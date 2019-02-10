import { Navigation } from 'react-native-navigation';

export function registerScreens() {
    Navigation.registerComponent('Home', () => require('../screens/Home').default);
    Navigation.registerComponent('News', () => require('../screens/News').default);
    Navigation.registerComponent('Profile/Profile', () => require('../screens/Profile/Profile').default);
    Navigation.registerComponent('Profile/About', () => require('../screens/Profile/About').default);
    Navigation.registerComponent('Initializing', (sc) => require('../screens/Initializing').default);
    Navigation.registerComponent('Menu', () => require('../screens/Menu').default);
    Navigation.registerComponent('Welcome', () => require('../screens/Welcome').default);
    Navigation.registerComponent('Inventory/List', () => require('../screens/Inventory/List').default);
    Navigation.registerComponent('Inventory/New', () => require('../screens/Inventory/New').default);
    Navigation.registerComponent('Inventory/Show', () => require('../screens/Inventory/Show').default);
    Navigation.registerComponent('Inventory/Scan', () => require('../screens/Inventory/Scan').default);
}