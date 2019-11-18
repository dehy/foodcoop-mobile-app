/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import 'reflect-metadata';
import { Navigation } from "react-native-navigation";
import EStyleSheet from 'react-native-extended-stylesheet';
import { registerScreens } from './src/utils/screens';
import { Sentry } from 'react-native-sentry';
import moment from 'moment';
import momentFr from 'moment/locale/fr';
import Database from './src/utils/Database';

moment.locale('fr');
if (!__DEV__) {
    Sentry.config('***REMOVED***').install();
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
