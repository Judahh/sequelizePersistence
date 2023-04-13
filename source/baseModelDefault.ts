import { Default, IDefault } from '@flexiblepersistence/default-initializer';
import {
  Includeable,
  Model,
  ModelAttributes,
  // ModelCtor,
  ModelType,
  ModelOptions,
  ModelStatic,
} from 'sequelize';
export default class BaseModelDefault extends Default {
  protected attributes: ModelAttributes | ModelAttributes[] = {};
  protected include?: Includeable | Includeable[];
  protected options: ModelOptions | ModelOptions[] = {};
  protected selector?: string;
  protected models?: {
    [key: string]: ModelStatic<any> | Model | ModelType;
  };
  protected role?: ModelStatic<any> | Model | ModelType;

  setRole(role: ModelStatic<any> | Model | ModelType, index?: number) {
    this.role = role;
    this.initRole(role, index);
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  protected initRole(
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    role: ModelStatic<any> | Model | ModelType,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    index?: number
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {}

  async formatResult(result?: any) {
    return result;
  }

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
