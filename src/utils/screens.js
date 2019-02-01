import { Navigation } from 'react-native-navigation';

export function registerScreens() {
    Navigation.registerComponent('Home', () => require('../screens/Home').default);
    Navigation.registerComponent('Initializing', (sc) => require('../screens/Initializing').default);
    Navigation.registerComponent('Menu', () => require('../screens/Menu').default);
    Navigation.registerComponent('Welcome', () => require('../screens/Welcome').default);
    Navigation.registerComponent('Screen2', () => require('../screens/Screen2').default);
    Navigation.registerComponent('Inventory', () => require('../screens/Inventory').default);
}