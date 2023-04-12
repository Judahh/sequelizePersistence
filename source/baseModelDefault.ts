import { Default, IDefault } from '@flexiblepersistence/default-initializer';
export default class BaseModelDefault extends Default {
  protected attributes = {};
  protected options = {};

  protected aliasFields?: {
    [key: string]: string | undefined;
  };

  getAliasFields() {
    return this.aliasFields;
  }

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
