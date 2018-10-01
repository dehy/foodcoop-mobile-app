import { Navigation } from 'react-native-navigation';
import { LEFT_SIDE_MENU_ID, RIGHT_SIDE_MENU_ID } from '../config';

function getId(side) {
    if (side === 'left') return LEFT_SIDE_MENU_ID;
    return RIGHT_SIDE_MENU_ID;
}

class Drawer {
    constructor() {
        this.visibility = {
            left: false,
            right: false,
        };

        Navigation.events().registerComponentDidAppearListener(({ componentId }) => {
            if (componentId === LEFT_SIDE_MENU_ID) {
                this.visibility.left = true;
            }

            if (componentId === RIGHT_SIDE_MENU_ID) {
                this.visibility.right = true;
            }
        });

        Navigation.events().registerComponentDidDisappearListener(({ componentId }) => {
            if (componentId === LEFT_SIDE_MENU_ID) {
                this.visibility.left = false;
            }

            if (componentId === RIGHT_SIDE_MENU_ID) {
                this.visibility.right = false;
            }
        });
    }

    // side: String ('left', 'right')
    open(side) {
        try {
            const id = getId(side);
            Navigation.mergeOptions(id, {
                sideMenu: {
                    [side]: {
                        visible: true,
                    },
                },
            });
            this.visibility[side] = true;
        } catch (error) {
            //
        }
    }

    // side: String ('left', 'right')
    close(side) {
        try {
            const id = getId(side);
            Navigation.mergeOptions(id, {
                sideMenu: {
                    [side]: {
                        visible: false,
                    },
                },
            });
            this.visibility[side] = false;
        } catch (error) {
            //
        }
    }

    // side: String ('left', 'right')
    toggle(side) {
        try {
            const id = getId(side);
            const visibility = !this.visibility[side];
            Navigation.mergeOptions(id, {
                sideMenu: {
                    [side]: {
                        visible: !this.visibility[side],
                    },
                },
            });
            this.visibility[side] = visibility;
        } catch (error) {
            //
        }
    }
}

export default new Drawer();