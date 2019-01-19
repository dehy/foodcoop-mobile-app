import { Navigation } from 'react-native-navigation'
import { LEFT_SIDE_MENU_ID } from '../config'

export const goToAuth = () => Navigation.setRoot({
    root: {
        component: {
            name: 'Welcome'
        },
    }
});

export const goHome = () => Navigation.setRoot({
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
                            name: 'Home',
                        }
                    }],
                }
            }
        }
    }
});