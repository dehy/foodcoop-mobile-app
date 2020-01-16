/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import { Navigation } from 'react-native-navigation';
import EStyleSheet from 'react-native-extended-stylesheet';
import { registerScreens } from './src/utils/screens';
// import * as Sentry from '@sentry/react-native';
import moment from 'moment';
import Database from './src/utils/Database';
// import DeviceInfo from 'react-native-device-info';

moment.locale('fr');
if (!__DEV__) {
    // Sentry.init({
    //     dsn: 'https://ade630e97f5947188b6bad45497c9462@sentry.admds.net/2',
    // });
    // Sentry.setRelease(`sp_mobile_app-${DeviceInfo.getVersion()}`);
}

registerScreens();
Database.connect();

EStyleSheet.build({});

Navigation.events().registerAppLaunchedListener(() => {
    Navigation.setRoot({
        root: {
            component: {
                name: 'Initializing',
            },
        },
    });
});
