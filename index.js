/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import { Navigation } from 'react-native-navigation';
import EStyleSheet from 'react-native-extended-stylesheet';
import { registerScreens } from './src/utils/screens';
import moment from 'moment';
import 'moment/locale/fr';
import Database from './src/utils/Database';
import { readableVersion, systemName } from './src/utils/helpers';
import * as Sentry from '@sentry/react-native';

moment.locale('fr');

Sentry.init({
    dsn: '***REMOVED***',
});
Sentry.setRelease(`mobile-app-${readableVersion()}`);

registerScreens();
Database.connect();

EStyleSheet.build({});

Navigation.events().registerAppLaunchedListener(() => {
    Navigation.setDefaultOptions({
        layout: {
            orientation: ['portrait'],
        },
    });
    Navigation.setRoot({
        root: {
            component: {
                name: 'Initializing',
            },
        },
    });
});
