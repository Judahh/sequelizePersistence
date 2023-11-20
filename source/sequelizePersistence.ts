/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// file deepcode ignore object-literal-shorthand: annoying
/* eslint-disable @typescript-eslint/no-explicit-any */
// file deepcode ignore no-any: any needed
import {
  IPersistence,
  PersistenceInfo,
  IOutput,
  // RelationValueDAODB,
  // SelectedItemValue,
  IInputCreate,
  IInputUpdate,
  IInputRead,
  IInputDelete,
  IInput,
  ITransaction,
} from 'flexiblepersistence';
import {
  Includeable,
  Model,
  ModelAttributes,
  ModelCtor,
  // ModelOptions,
  ModelStatic,
  Op,
  Sequelize,
  Transaction as T,
  GroupOption,
  Order,
} from 'sequelize';
import BaseModelDefault from './baseModelDefault';
import { SequelizePersistenceInfo } from './sequelizePersistenceInfo';
import Utils from './utils';
import { Pool } from 'pg';
import { Transaction } from './transaction';
export class SequelizePersistence implements IPersistence {
  private persistenceInfo: SequelizePersistenceInfo;
  private sequelize: Sequelize;

  element: {
    [name: string]: BaseModelDefault;
  } = {};

  operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col,
  };

  getDefaultUser(dialect: string): string {
    switch (
      dialect // mssql, mariadb, mysql, oracle, postgres, sqlite, snowflake
    ) {
      case 'mssql':
        return 'sa';
      case 'postgres':
        return 'postgres';
      default:
        return 'root';
    }
  }

  constructor(
    persistenceInfo: SequelizePersistenceInfo,
    element?: {
      [name: string]: BaseModelDefault;
    }
  ) {
    this.persistenceInfo = persistenceInfo;
    if (this.persistenceInfo.uri) {
      this.persistenceInfo.sequelizeOptions = {
        ...this.persistenceInfo.sequelizeOptions,
        dialect: this.persistenceInfo.sequelizeOptions?.dialect || 'mysql',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        host: this.persistenceInfo.host,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        port: this.persistenceInfo.port,
      };
      const database = this.persistenceInfo.database || 'database';
      const username =
        this.persistenceInfo.username ||
        this.getDefaultUser(
          this.persistenceInfo.sequelizeOptions?.dialect || 'mysql'
        );
      const password = this.persistenceInfo.password;
      console.log(database, username, password);
      console.log(this.persistenceInfo);
      this.sequelize = new Sequelize(
        database,
        username,
        password as string,
        this.persistenceInfo.sequelizeOptions
      );
    } else throw new Error('Database URI nonexistent.');
    if (element) this.setElement(element);
  }
  async transaction(
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    options?: any,
    // eslint-disable-next-line no-unused-vars
    callback?: (transaction: ITransaction) => Promise<void>
  ): Promise<ITransaction> {
    const t = new Transaction(this.sequelize);
    await t.begin(options);
    await callback?.(t);
    return t;
  }
  clear(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const pool = new Pool(this.persistenceInfo);
        await Utils.dropTables(pool);
        await Utils.init(pool);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  protected initElement() {
    const roles: {
      element: BaseModelDefault;
      role: ModelStatic<any>;
      index?: number;
    }[] = [];
    for (const key in this.element) {
      if (Object.prototype.hasOwnProperty.call(this.element, key)) {
        const element = this.element[key];
        const options = element.getOptions();
        // base sequelize model
        // this.sequelize.define(
        //   element.getName(),
        //   element.getAttributes(0) as ModelAttributes,
        //   options[0]
        // );
        if (Array.isArray(options)) {
          for (let index = 0; index < options.length; index++) {
            const option = options[index];
            const name = element.getName() + index;
            const attributes = element.getAttributes(index) as ModelAttributes;
            const role = this.sequelize.define(name, attributes, option);
            roles.push({ element, role, index });
          }
        } else {
          const role = this.sequelize.define(
            element.getName(),
            element.getAttributes() as ModelAttributes,
            options
          );
          roles.push({ element, role });
        }
      }
    }
    for (const aRole of roles) {
      const { element, role, index } = aRole;
      element?.setModels?.(this.sequelize.models);
      element?.setRole?.(role, index);
    }
  }

  setElement(element: { [name: string]: BaseModelDefault }) {
    this.element = element;
    this.initElement();
  }

  protected aggregateFromReceivedArray(realInput: any[]): any[] {
    return realInput.map((value) => this.aggregateFromReceived(value));
  }

  protected aggregateFromReceived(value): any {
    if (value.id)
      return {
        ...value,
        id: value.id.toString(),
      };
    return value;
  }

  protected realInput(input?: IInput<unknown, unknown>) {
    // console.log(input);

    let realInput = input?.item ? input?.item : {};
    if (realInput)
      if (Array.isArray(realInput))
        realInput = this.aggregateFromReceivedArray(realInput);
      else realInput = this.aggregateFromReceived(realInput);

    // console.log(realInput);
    return realInput;
  }

  private dotToObject(input?: any) {
    if (!input) {
      return input;
    }
    for (const key in input) {
      if (Object.hasOwnProperty.call(input, key)) {
        const element = input[key];
        if (key.includes('.')) {
          const newKey = key.split('.')[0];
          const newKey2 = key.split('.').slice(1).join('.');
          input[newKey] = input[newKey] || {};
          input[newKey][newKey2] = element;
          delete input[key];
          if (typeof element === 'object') {
            input[newKey][newKey2] = this.dotToObject(element);
          }
        } else if (typeof element === 'object') {
          input[key] = this.dotToObject(element);
        }
      }
    }
    return input;
  }

  private generatePageOptions(
    input: IInputCreate | IInputRead | IInputUpdate | IInputDelete
  ): { page?: number; pageSize?: number } {
    const options =
      input.eventOptions || input.options || input.additionalOptions || {};
    options.pageSize = options.pageSize || options.pagesize;
    options.page = options.page || options.pageNumber || options.pagenumber;
    if (options.pageSize) options.pageSize = Number(options.pageSize);
    if (options.page) options.page = Number(options.page);
    if (options.pageSize && !options.page) options.page = 0;
    return options;
  }

  private replaceOperators(input?: any) {
    if (!input) {
      return input;
    }

    input = this.dotToObject(input);
    for (const key in input) {
      if (Object.hasOwnProperty.call(input, key)) {
        const element = input[key];
        if (key.includes('$')) {
          const newKey = this.operatorsAliases[key];
          input[newKey] = element;
          delete input[key];
          if (typeof element === 'object') {
            input[newKey] = this.replaceOperators(element);
          }
        } else if (typeof element === 'object') {
          input[key] = this.replaceOperators(element);
        }
      }
    }
    return input;
  }

  private async formatResult(
    element: BaseModelDefault,
    result?: any | any[],
    index?: number
  ) {
    if (result) {
      if (Array.isArray(result)) {
        return await Promise.all(
          result.map(
            async (aResult) => await this.formatResult(element, aResult, index)
          )
        );
      } else {
        return (await element?.formatResult(result, index)) || result;
      }
    }
    return result;
  }

  private generateWhere(selectedItem) {
    const where = {};
    for (const key in selectedItem) {
      if (Object.hasOwnProperty.call(selectedItem, key)) {
        if (
          Array.isArray(selectedItem[key]) &&
          selectedItem[key].includes(null)
        ) {
          where[key] = {
            [Op.or]: [
              {
                [Op.in]: selectedItem[key].filter((e) => e !== null),
              },
              {
                [Op.eq]: null,
              },
            ],
          };
        } else {
          where[key] = selectedItem[key];
        }
      }
    }
    return where;
  }

  async rearrangeInclude(where, include) {
    if (Array.isArray(include))
      for (const includeElement of include) {
        if (includeElement.as && where[includeElement.as]) {
          includeElement.where = { ...where[includeElement.as] };
          delete where[includeElement.as];
          const newWI = await this.rearrangeInclude(
            includeElement.where,
            includeElement.include
          );
          includeElement.where = newWI?.where || {};
          includeElement.include = newWI?.include || [];
        }
      }
    else if (include && include.as && where[include.as]) {
      include.where = { ...where[include.as] };
      delete where[include.as];
      const newWI = await this.rearrangeInclude(include.where, include.include);
      include.where = newWI?.where || {};
      include.include = newWI?.include || [];
    }
    // if(Object.keys(where).length == 0) where = undefined;
    return { where, include };
  }

  private async sendRequest(
    element: BaseModelDefault,
    model: ModelCtor<Model>,
    method: string,
    selectedItem,
    limit?: number,
    offset?: number,
    query?: { query: string; values: unknown[] } | string,
    qOptions?: any,
    include?: Includeable | Includeable[],
    group?: GroupOption,
    order?: Order,
    attributes?: ModelAttributes,
    data?,
    receivedMethod?: string,
    input?: IInput<unknown, unknown>,
    index?: number,
    transaction?: T
  ) {
    try {
      let where = this.generateWhere(selectedItem);
      const newWI = await this.rearrangeInclude(where, include);
      include = newWI.include;
      where = newWI.where;
      const queryBind = {
        ...(where || {}),
        ...(data || {}),
        ...(input?.item || {}),
      };
      const newQOptions = qOptions || {};
      newQOptions.bind = { ...newQOptions.bind, ...queryBind };
      let step = query
        ? await this.sequelize.query(query, newQOptions)
        : data
        ? await model[method](
            data,
            {
              where,
              truncate: selectedItem ? undefined : true,
              limit,
              offset,
              include,
              attributes: group ? attributes : undefined,
              group,
              order,
              transaction,
            },
            {
              transaction,
            }
          )
        : await model[method](
            {
              where,
              truncate: selectedItem ? undefined : true,
              limit,
              offset,
              include,
              attributes: group ? attributes : undefined,
              group,
              order,
              transaction,
            },
            {
              transaction,
            }
          );
      if (receivedMethod && !query) {
        const newData =
          receivedMethod.includes('destroy') || receivedMethod.includes('find')
            ? undefined
            : this.realInput(input);
        if (step) step = step ? await step[receivedMethod](newData) : undefined;
      }
      let received;
      if (step) {
        if (query) received = step[0];
        else if (Array.isArray(step))
          received = step.map(
            (cOutput) => cOutput.dataValues || cOutput.AFFECTEDROWS
          );
        else received = step.dataValues;
        if (method.includes('destroy') || method.includes('update'))
          received = step;
      }
      let isPrimitive = false;
      if (received) {
        if (Array.isArray(received)) {
          if (received.length == 0) isPrimitive = false;
          else if (received.length >= 1)
            isPrimitive = typeof received[0] !== 'object';
        } else {
          isPrimitive = typeof received !== 'object';
        }
      }
      if (!isPrimitive)
        received = await this.formatResult(element, received, index);
      const persistencePromise: IOutput<unknown, unknown, unknown> = {
        receivedItem: received,
        result: received,
        selectedItem: input?.selectedItem,
        sentItem: input?.item, //| input.sentItem,
      };
      await transaction?.commit();
      return persistencePromise;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }

  private async makePromise(
    input: IInput<unknown, unknown>,
    method: string
  ): Promise<IOutput<unknown, unknown, unknown>> {
    const sName0 = input.scheme;
    const sName1 = sName0?.[0]?.toLowerCase() + sName0?.slice(1);
    const element = this.element[sName0] || this.element[sName1];
    const selector = element.getSelector();
    const selected: number | undefined = selector
      ? (input.selectedItem as any)?.[selector] || 0
      : undefined;
    if (selector != undefined) delete input.selectedItem?.[selector];
    const model =
      this.sequelize.models[element.getName()] ||
      this.sequelize.models[sName0] ||
      this.sequelize.models[sName1] ||
      this.sequelize.models[element.getName() + selected] ||
      this.sequelize.models[sName0 + selected] ||
      this.sequelize.models[sName1 + selected];

    const receivedMethod = method.replace('One', '');

    const isSingle = method.includes('One');

    const isDeleteOrUpdate =
      method.includes('destroy') || method.includes('update');

    const isSingleDeleteOrUpdate = isDeleteOrUpdate && isSingle;

    method = isSingleDeleteOrUpdate ? 'findOne' : method;

    // console.log('METHOD:', method);
    // console.log('singleDeleteOrUpdate:', singleDeleteOrUpdate);
    // console.log('input.selectedItem:', input.selectedItem);

    const data =
      method.includes('destroy') || method.includes('find')
        ? undefined
        : this.realInput(input);

    const selectedItem = this.replaceOperators(input.selectedItem);
    const options = this.generatePageOptions(input);
    const limit = options.pageSize != undefined ? options.pageSize : undefined;
    const offset =
      options.pageSize != undefined
        ? (options.page || 0) * options.pageSize
        : undefined;
    const include = element.getMethodInclude(method, receivedMethod, selected);
    const group = element.getMethodGroup(method, receivedMethod, selected);
    const order = element.getMethodOrder(method, receivedMethod, selected);
    const attributes = element.getAttributes(selected) as ModelAttributes;
    const transaction = await this.sequelize.transaction();
    const qOptions = element.getQueryOptions(method, isSingle);
    const query = element.getQuery(method, isSingle);
    return await this.sendRequest(
      element,
      model,
      method,
      selectedItem,
      limit,
      offset,
      query,
      qOptions,
      include,
      group,
      order,
      attributes,
      data,
      isSingleDeleteOrUpdate ? receivedMethod : undefined,
      input,
      selected,
      transaction
    );
  }
  other(
    input: IInput<unknown, unknown>
  ): Promise<IOutput<unknown, unknown, unknown>> {
    return new Promise<IOutput<unknown, unknown, unknown>>((resolve) => {
      resolve({
        receivedItem: input,
      });
    });
  }

  async loopSingle(input: IInput<any, any>, method: string) {
    const inputs = Array.isArray(input.item)
      ? input.item.map((i) => ({ ...input, item: i }))
      : [input];
    const results: IOutput<unknown, unknown, unknown>[] = [];
    for (const input of inputs) {
      results.push(await this.makePromise(input, method));
    }
    return {
      receivedItem: results.map((r) => r.receivedItem),
      result: results.map((r) => r.result),
      selectedItem: input.selectedItem,
      sentItem: input.item,
    } as IOutput<unknown, unknown, unknown>;
  }

  create(
    input: IInputCreate<unknown>
  ): Promise<IOutput<unknown, unknown, unknown>> {
    // console.log('CREATE:', input);
    return Array.isArray(input.item)
      ? this.loopSingle(input, 'create') //this.makePromise(input, 'bulkCreate')
      : this.makePromise(input, 'create');
  }
  read(input: IInputRead): Promise<IOutput<unknown, unknown, unknown>> {
    // console.log('read', input);
    return input.single
      ? this.makePromise(input, 'findOne')
      : this.makePromise(input, 'findAll');
  }
  update(
    input: IInputUpdate<unknown>
  ): Promise<IOutput<unknown, unknown, unknown>> {
    return input.single
      ? this.makePromise(input, 'updateOne')
      : this.makePromise(input, 'update');
  }
  delete(input: IInputDelete): Promise<IOutput<unknown, unknown, unknown>> {
    // console.log('FUCKING DELETE');

    return input.single
      ? this.makePromise(input, 'destroyOne')
      : this.makePromise(input, 'destroy');
  }

  getPersistenceInfo(): PersistenceInfo {
    return this.persistenceInfo;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getSequelize() {
    return this.sequelize;
  }

  close(): Promise<boolean> {
    return this.sequelize.close() as Promise<unknown> as Promise<boolean>;
  }
}
