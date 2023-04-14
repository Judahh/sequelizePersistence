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
        host: this.persistenceInfo.host,
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
        if (Array.isArray(options)) {
          for (let index = 0; index < options.length; index++) {
            const option = options[index];
            const role = this.sequelize.define(
              element.getName() + index,
              element.getAttributes(index) as ModelAttributes,
              option
            );
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

  private async formatResult(element: BaseModelDefault, result?: any | any[]) {
    if (result) {
      if (Array.isArray(result)) {
        return await Promise.all(
          result.map(
            async (aResult) => await this.formatResult(element, aResult)
          )
        );
      } else {
        return (await element?.formatResult(result)) || result;
      }
    }
    return result;
  }

  private async sendRequest(
    element: BaseModelDefault,
    model: ModelCtor<Model>,
    method: string,
    selectedItem,
    limit?: number,
    offset?: number,
    include?: Includeable | Includeable[],
    data?,
    receivedMethod?: string,
    input?: IInput<unknown, unknown>
  ) {
    let step = data
      ? await model[method](data, {
          where: selectedItem,
          truncate: selectedItem ? undefined : true,
          limit,
          offset,
          include,
        })
      : await model[method]({
          where: selectedItem,
          truncate: selectedItem ? undefined : true,
          limit,
          offset,
          include,
        });
    if (receivedMethod) {
      const newData =
        receivedMethod.includes('destroy') || receivedMethod.includes('find')
          ? undefined
          : this.realInput(input);
      if (step) step = step ? await step[receivedMethod](newData) : undefined;
    }
    let received;
    if (step) {
      if (Array.isArray(step))
        received = step.map(
          (cOutput) => cOutput.dataValues || cOutput.AFFECTEDROWS
        );
      else received = step.dataValues;
      if (method.includes('destroy') || method.includes('update'))
        received = step;
    }
    received = await this.formatResult(element, received);
    const persistencePromise: IOutput<unknown, unknown, unknown> = {
      receivedItem: received,
      result: received,
      selectedItem: input?.selectedItem,
      sentItem: input?.item, //| input.sentItem,
    };
    return persistencePromise;
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
    const model =
      this.sequelize.models[element.getName()] ||
      this.sequelize.models[sName0] ||
      this.sequelize.models[sName1] ||
      this.sequelize.models[element.getName() + selected] ||
      this.sequelize.models[sName0 + selected] ||
      this.sequelize.models[sName1 + selected];

    const receivedMethod = method.replace('One', '');

    const single = method.includes('One');

    const deleteOrUpdate =
      method.includes('destroy') || method.includes('update');

    const singleDeleteOrUpdate = deleteOrUpdate && single;

    method = singleDeleteOrUpdate ? 'findOne' : method;

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
    return await this.sendRequest(
      element,
      model,
      method,
      selectedItem,
      limit,
      offset,
      include,
      data,
      singleDeleteOrUpdate ? receivedMethod : undefined,
      input
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

  create(
    input: IInputCreate<unknown>
  ): Promise<IOutput<unknown, unknown, unknown>> {
    // console.log('CREATE:', input);
    return Array.isArray(input.item)
      ? this.makePromise(input, 'bulkCreate')
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
