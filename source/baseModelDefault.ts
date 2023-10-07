/* eslint-disable @typescript-eslint/no-explicit-any */
import { Default, IDefault } from '@flexiblepersistence/default-initializer';
import {
  Includeable,
  Model,
  ModelAttributes,
  // ModelCtor,
  ModelType,
  ModelOptions,
  ModelStatic,
  GroupOption,
  QueryOptionsWithType,
  QueryOptionsWithModel,
  QueryOptions,
  Order,
} from 'sequelize';
type QOptions =
  | QueryOptionsWithType<any>
  | QueryOptionsWithModel<any>
  | QueryOptions;
type Query = { query: string; values: unknown[] } | string;
export default class BaseModelDefault extends Default {
  protected attributes: ModelAttributes | ModelAttributes[] = {};
  protected include?: Includeable | Includeable[] | Includeable[][];
  protected group?: GroupOption | GroupOption[];
  protected order?: Order | Order[];
  protected options: ModelOptions | ModelOptions[] = {};
  protected selector?: string;
  protected models?: {
    [key: string]: ModelStatic<any> | Model | ModelType;
  };
  protected role?: ModelStatic<any> | Model | ModelType;
  protected queries?: {
    [key: string]:
      | {
          single?: Query;
          multiple?: Query;
        }
      | Query;
  };

  protected queriesOptions?: {
    [key: string]:
      | {
          single?: QOptions;
          multiple?: QOptions;
        }
      | QOptions;
  };

  getQuery(method: string, isSingle?: boolean) {
    const queries = this.queries?.[method] as any;
    const query = isSingle
      ? queries?.single || queries
      : queries?.multiple || queries;
    return query as Query;
  }

  getQueryOptions(method: string, isSingle?: boolean) {
    const queries = this.queriesOptions?.[method] as any;
    const query = isSingle
      ? queries?.single || queries
      : queries?.multiple || queries;
    return query as QOptions;
  }

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

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async formatResult(result?: any, index?: number) {
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

  getOptions(index?: number) {
    return Array.isArray(this.options) && index != undefined
      ? this.options[index]
      : this.options;
  }

  getInclude(index?: number) {
    return Array.isArray(this.options) && index != undefined
      ? this.include?.[index]
      : this.include;
  }

  getGroup(index?: number) {
    return Array.isArray(this.options) && index != undefined
      ? this.group?.[index]
      : this.group;
  }

  getOrder(index?: number) {
    return Array.isArray(this.options) && index != undefined
      ? this.order?.[index]
      : this.order;
  }

  getMethodInclude(method?: string, receivedMethod?: string, index?: number) {
    return method?.includes('find') ||
      (method == undefined && receivedMethod == undefined)
      ? this.getInclude(index)
      : undefined;
  }

  getMethodGroup(method?: string, receivedMethod?: string, index?: number) {
    return method?.includes('find') ||
      (method == undefined && receivedMethod == undefined)
      ? this.getGroup(index)
      : undefined;
  }

  getMethodOrder(method?: string, receivedMethod?: string, index?: number) {
    return method?.includes('find') ||
      (method == undefined && receivedMethod == undefined)
      ? this.getOrder(index)
      : undefined;
  }

  constructor(initDefault?: IDefault) {
    super(initDefault);
  }
  init(initDefault?: IDefault): void {
    // console.log('init:', initDefault);

    super.init(initDefault);
  }
}
