import { Default, IDefault } from '@flexiblepersistence/default-initializer';
import {
  Includeable,
  Model,
  ModelAttributes,
  // ModelCtor,
  ModelOptions,
  ModelStatic,
} from 'sequelize';
export default class BaseModelDefault extends Default {
  protected attributes: ModelAttributes | ModelAttributes[] = {};
  protected include?: Includeable | Includeable[];
  protected options: ModelOptions | ModelOptions[] = {};
  protected selector?: string;
  protected models?: {
    [key: string]: ModelStatic<any> | Model;
  };

  setModels(models: { [key: string]: ModelStatic<any> | Model }) {
    this.models = models;
  }

  getSelector() {
    return this.selector;
  }

  getModels() {
    return this.models;
  }

  getAttributes(index?: number) {
    return Array.isArray(this.attributes) && index != undefined
      ? this.attributes[index]
      : this.attributes;
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
