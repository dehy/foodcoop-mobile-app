/**
 * Foodcoop Mobile App - Helping foodcoop cooperators managing their shop
 * Copyright (C) 2021 Arnaud de Mouhy
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import {Navigation} from 'react-native-navigation';
import EStyleSheet from 'react-native-extended-stylesheet';
import moment from 'moment';
import 'moment/locale/fr';
import {Settings} from 'luxon';
import 'intl';
import 'intl/locale-data/jsonp/fr';
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import 'reflect-metadata';

Sentry.init({
    dsn: Config.SENTRY_DSN,
    environment: __DEV__ ? 'dev' : 'production',
});

Navigation.registerComponent(
    'Lists/GoodsReceipt/Export',
    () => require('./src/screens/Lists/GoodsReceipt/Export').default,
);
Navigation.registerComponent('Lists/GoodsReceipt/New', () => require('./src/screens/Lists/GoodsReceipt/New').default);
Navigation.registerComponent('Lists/GoodsReceipt/Scan', () => require('./src/screens/Lists/GoodsReceipt/Scan').default);
Navigation.registerComponent('Lists/GoodsReceipt/Show', () => require('./src/screens/Lists/GoodsReceipt/Show').default);
Navigation.registerComponent('Lists/Inventory/Export', () => require('./src/screens/Lists/Inventory/Export').default);
Navigation.registerComponent('Lists/Inventory/New', () => require('./src/screens/Lists/Inventory/New').default);
Navigation.registerComponent('Lists/Inventory/Scan', () => require('./src/screens/Lists/Inventory/Scan').default);
Navigation.registerComponent('Lists/Inventory/Show', () => require('./src/screens/Lists/Inventory/Show').default);
Navigation.registerComponent('Lists/Label/New', () => require('./src/screens/Lists/Label/New').default);
Navigation.registerComponent('Lists/Label/Show', () => require('./src/screens/Lists/Label/Show').default);
Navigation.registerComponent('Lists/Label/Scan', () => require('./src/screens/Lists/Label/Scan').default);
Navigation.registerComponent('Lists/Label/Export', () => require('./src/screens/Lists/Label/Export').default);
Navigation.registerComponent('Lists/List', () => require('./src/screens/Lists/List').default);
Navigation.registerComponent('Lists/NewStepType', () => require('./src/screens/Lists/NewStepType').default);
Navigation.registerComponent('News/List', () => require('./src/screens/News/List').default);
Navigation.registerComponent('News/Show', () => require('./src/screens/News/Show').default);
Navigation.registerComponent('Plus', () => require('./src/screens/Plus').default);
Navigation.registerComponent('Plus/About', () => require('./src/screens/Plus/About').default);
Navigation.registerComponent('Plus/Maintenance', () => require('./src/screens/Plus/Maintenance').default);
Navigation.registerComponent(
    'Plus/Maintenance/Cookies',
    () => require('./src/screens/Plus/Maintenance/Cookies').default,
);
Navigation.registerComponent(
    'Plus/Maintenance/Database',
    () => require('./src/screens/Plus/Maintenance/Database').default,
);
Navigation.registerComponent('Scanner', () => require('./src/screens/Scanner').default);
Navigation.registerComponent('Welcome', () => require('./src/screens/Welcome').default);
Navigation.registerComponent('Initializing', () => require('./src/screens/Initializing').default);

Navigation.events().registerAppLaunchedListener(() => {
    // Moment
    moment.locale('fr');

    // Luxon
    Settings.defaultLocale = 'fr';

    EStyleSheet.build({});

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
