'use strict';

import {ChildEntity} from 'typeorm';
import BaseList from './BaseList';

@ChildEntity()
export default class LabelList extends BaseList {
    public static icon = 'tag';
    public static label = 'Étiquettes';
}
