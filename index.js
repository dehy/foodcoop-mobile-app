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
import momentFr from 'moment/locale/fr';
import Database from './src/utils/Database';

moment.locale('fr');
if (!__DEV__) {
    Sentry.init({ 
        dsn: 'https://4924f3cfe9d84a4ba43a95ed1a959f1d:ddf962666b804d018cd8fe5b68b332f4@sentry.akerbis.com/9', 
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
