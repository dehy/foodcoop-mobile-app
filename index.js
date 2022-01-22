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
import Database from './src/utils/Database';
import {readableVersion} from './src/utils/helpers';
import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';
import {registerScreens} from 'react-native-navigation-register-screens';

import Initializing from './src/screens/Initializing';
import ListsGoodsReceiptExport from './src/screens/Lists/GoodsReceipt/Export';
import ListsGoodsReceiptNew from './src/screens/Lists/GoodsReceipt/New';
import ListsGoodsReceiptScan from './src/screens/Lists/GoodsReceipt/Scan';
import ListsGoodsReceiptShow from './src/screens/Lists/GoodsReceipt/Show';
import ListsInventoryExport from './src/screens/Lists/Inventory/Export';
import ListsInventoryNew from './src/screens/Lists/Inventory/New';
import ListsInventoryScan from './src/screens/Lists/Inventory/Scan';
import ListsInventoryShow from './src/screens/Lists/Inventory/Show';
import ListsList from './src/screens/Lists/List';
import ListsNewStepType from './src/screens/Lists/NewStepType';
import NewsList from './src/screens/News/List';
import NewsShow from './src/screens/News/Show';
import Plus from './src/screens/Plus';
import PlusAbout from './src/screens/Plus/About';
import PlusMaintenance from './src/screens/Plus/Maintenance';
import PlusMaintenanceCookies from './src/screens/Plus/Maintenance/Cookies';
import PlusMaintenanceDatabase from './src/screens/Plus/Maintenance/Database';
import Scanner from './src/screens/Scanner';
import Welcome from './src/screens/Welcome';

console.log(Initializing.screenName);

moment.locale('fr');

Sentry.init({
    dsn: Config.SENTRY_DSN,
});
Sentry.setRelease(`mobile-app-${readableVersion()}`);

Settings.defaultLocale = 'fr';

registerScreens([
    Initializing,
    ListsGoodsReceiptExport,
    ListsGoodsReceiptNew,
    ListsGoodsReceiptScan,
    ListsGoodsReceiptShow,
    ListsInventoryExport,
    ListsInventoryNew,
    ListsInventoryScan,
    ListsInventoryShow,
    ListsList,
    ListsNewStepType,
    NewsList,
    NewsShow,
    Plus,
    PlusAbout,
    PlusMaintenance,
    PlusMaintenanceCookies,
    PlusMaintenanceDatabase,
    Scanner,
    Welcome,
]);

Database.connect().then(() => {
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
});
