/* eslint-disable @typescript-eslint/ban-ts-comment */
import { settings } from 'ts-mixer';
import { Default, DefaultInitializer } from 'flexiblepersistence';
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

  constructor(initDefault?: DefaultInitializer) {
    super(initDefault);
  }
  init(initDefault?: DefaultInitializer): void {
    // console.log('init:', initDefault);

    super.init(initDefault);
  }
}
