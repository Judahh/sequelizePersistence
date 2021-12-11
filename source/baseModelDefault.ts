import { Default, IDefault } from '@flexiblepersistence/default-initializer';
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
