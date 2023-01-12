'use strict';

import {ChildEntity} from 'typeorm';
import BaseEntry from './BaseEntry';

@ChildEntity()
export default class LabelEntry extends BaseEntry {}
