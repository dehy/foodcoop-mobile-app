import { Navigation } from 'react-native-navigation'
import Drawer from './Drawer';

export const goToAuth = () => Navigation.setRoot({
    root: {
        component: {
            name: 'Welcome'
        },
    }
});

export function goHome() {
    
    Navigation.setDefaultOptions({
        bottomTab: {
          iconColor: "black",
          textColor: "black",
          selectedIconColor: "blue",
          selectedTextColor: "blue"
        }
    });

    Navigation.setRoot({
        root: {
            bottomTabs: {
                children: [
                    {
                        stack: {
                            children: [
                                {
                                    component: {
                                        name: 'News'
                                    }
                                }
                            ],
                            options: {
                                bottomTab: {
                                    text: 'News',
                                    icon: require('../../assets/icons/newspaper-regular.png')
                                }
                            }
                        }
                    },
                    {
                        stack: {
                            children: [
                                {
                                    component: {
                                        name: 'Scanner'
                                    }
                                }
                            ],
                            options: {
                                bottomTab: {
                                    text: 'Scanette',
                                    icon: require('../../assets/icons/barcode-read-regular.png')
                                }
                            }
                        }
                    },
                    {
                        stack: {
                            children: [
                                {
                                    component: {
                                        name: 'Inventory/List'
                                    }
                                }
                            ],
                            options: {
                                bottomTab: {
                                    text: 'Inventaire',
                                    icon: require('../../assets/icons/clipboard-list-check-regular.png')
                                }
                            }
                        }
                    },
                    {
                        stack: {
                            children: [
                                {
                                    component: {
                                        name: 'Settings/Settings'
                                    }
                                }
                            ],
                            options: {
                                bottomTab: {
                                    text: 'Paramètres',
                                    icon: require('../../assets/icons/sliders-h-regular.png')
                                }
                            }
                        }
                    }
                ]
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
            }
        }
    }
    return {};
};