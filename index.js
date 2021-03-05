/**
 * Foodcoop Mobile App - Helping foodcoop cooperators managing their shop
 * Copyright (C) 2021 Arnaud de Mouhy
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 * 
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
import Config from 'react-native-config';

moment.locale('fr');

Sentry.init({
    dsn: Config.SENTRY_DSN,
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
