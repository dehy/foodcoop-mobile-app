/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import 'reflect-metadata';
import { Navigation } from "react-native-navigation";
import EStyleSheet from 'react-native-extended-stylesheet';
import { registerScreens } from './src/utils/screens';
import * as Sentry from '@sentry/react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Database from './src/utils/Database';

moment.locale('fr');
if (!__DEV__) {
    Sentry.init({ 
        dsn: '***REMOVED***', 
      });
}

registerScreens();
Database.connect();

EStyleSheet.build({

});

Navigation.events().registerAppLaunchedListener(() => {
    Navigation.setRoot({
        root: {
            component: {
                name: "Initializing"
            }
        }
    });
});
