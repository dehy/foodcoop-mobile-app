'use strict';

import 'react-native-get-random-values';
import Realm from 'realm';

import InventoryList from '../entities/Lists/InventoryList';
import InventoryEntry from '../entities/Lists/InventoryEntry';

export default class Database {
    private static instance: Database;
    public static realm: Realm;

    public static sharedInstance(): Database {
        if (Database.instance === undefined) {
            Database.instance = new Database();
        }

        return this.instance;
    }

    static async connect(): Promise<void> {
        Database.realm = await Realm.open({
            path: 'supercoop',
            schema: [InventoryList, InventoryEntry],
            deleteRealmIfMigrationNeeded: __DEV__,
        });
    }

    resetDatabase(): void {
        Database.realm.write(() => {
            Database.realm.deleteAll();
        });
    }
}
