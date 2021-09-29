/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { settings } from 'ts-mixer';
import { Default, IDefault } from '@flexiblepersistence/default-initializer';
settings.initFunction = 'init';
/* eslint-disable @typescript-eslint/no-explicit-any */
export default class BaseModelDefault extends Default {
  protected attributes = {};
  protected options = {};

  getAttributes() {
    return this.attributes;
  }

  getOptions() {
    return this.options;
  }

  constructor(initDefault?: IDefault) {
    super(initDefault);
  }
  init(initDefault?: IDefault): void {
    // console.log('init:', initDefault);

    super.init(initDefault);
  }
}
