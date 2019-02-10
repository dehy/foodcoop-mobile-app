/**
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import { Navigation } from "react-native-navigation";
import EStyleSheet from 'react-native-extended-stylesheet';
import { registerScreens } from './src/utils/screens';
import { Sentry } from 'react-native-sentry';
import moment from 'moment';
import momentFr from 'moment/locale/fr';
import './src/utils/utils';

moment.locale('fr');
// Sentry.config('***REMOVED***').install();

registerScreens();

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
