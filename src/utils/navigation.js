import { Navigation } from 'react-native-navigation'
import { LEFT_SIDE_MENU_ID } from '../config'
import Drawer from './Drawer';

export const goToAuth = () => Navigation.setRoot({
    root: {
        component: {
            name: 'Welcome'
        },
    }
});

export function goHome() {
    Navigation.setRoot({
        root: {
            sideMenu: {
                left: {
                    component: {
                        id: LEFT_SIDE_MENU_ID,
                        name: 'Menu'
                    }
                },
                center: {
                    stack: {
                        id: 'App',
                        children: [{
                            component: {
                                id: 'Home',
                                name: 'Home',
                            }
                        }],
                    }
                }
            }
        }
    });
}

export function goToScreen(screen) {
    Drawer.close('left');
    Navigation.setStackRoot('App', [{
        component: {
            id: screen,
            name: screen,
        }
    }]);
};

export function defaultScreenOptions(screenTitle) {
    return {
        topBar: {
            title: {
                text: screenTitle,
                fontSize: 20,
            },
            leftButtons: [
                {
                    id: 'leftDrawerButton',
                    icon: require('../../assets/icons/menu.png')
                }
            ]
        }
    }
};