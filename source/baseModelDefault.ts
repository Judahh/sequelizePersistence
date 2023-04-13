import { Default, IDefault } from '@flexiblepersistence/default-initializer';
import { Includeable, ModelAttributes, ModelOptions } from 'sequelize';
export default class BaseModelDefault extends Default {
  protected attributes: ModelAttributes = {};
  protected include?: Includeable | Includeable[];
  protected options: ModelOptions = {};

  getAttributes() {
    return this.attributes;
  }

  getOptions() {
    return this.options;
  }

  getInclude() {
    return this.include;
  }

  constructor(initDefault?: IDefault) {
    super(initDefault);
  }
  init(initDefault?: IDefault): void {
    // console.log('init:', initDefault);

    super.init(initDefault);
  }
}
