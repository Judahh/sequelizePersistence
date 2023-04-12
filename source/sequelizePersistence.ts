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
import { Sequelize } from 'sequelize';
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

  constructor(
    persistenceInfo: SequelizePersistenceInfo,
    element?: {
      [name: string]: BaseModelDefault;
    }
  ) {
    this.persistenceInfo = persistenceInfo;
    if (this.persistenceInfo.uri) {
      // console.log('log:', this.persistenceInfo.uri);
      this.sequelize = new Sequelize(
        this.persistenceInfo.uri,
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
    for (const key in this.element) {
      if (Object.prototype.hasOwnProperty.call(this.element, key)) {
        const element = this.element[key];
        this.sequelize.define(
          element.getName(),
          element.getAttributes(),
          element.getOptions()
        );
      }
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

  protected realInput(input: IInput<unknown, unknown>) {
    // console.log(input);

    let realInput = input.item ? input.item : {};
    if (realInput)
      if (Array.isArray(realInput))
        realInput = this.aggregateFromReceivedArray(realInput);
      else realInput = this.aggregateFromReceived(realInput);

    // console.log(realInput);
    return realInput;
  }

  private persistencePromise(
    input: IInput<unknown, unknown>,
    method: string,
    resolve,
    reject
  ) {
    const model = this.sequelize.models[input.scheme];

    const baseModel = this.element[input.scheme];

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const aliasFields = baseModel.getAliasFields();
    // console.log(input);

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

    const newData =
      receivedMethod.includes('destroy') || receivedMethod.includes('find')
        ? undefined
        : this.realInput(input);

    const element = data
      ? model[method](data, {
          where: input.selectedItem,
          truncate: input.selectedItem ? undefined : true,
        })
      : model[method]({
          where: input.selectedItem,
          truncate: input.selectedItem ? undefined : true,
        });
    singleDeleteOrUpdate
      ? element
          .then((output) => {
            // console.log('OUTPUT MID:', output);
            // console.log('OUTPUT receivedMethod:', receivedMethod);
            if (output) return output[receivedMethod](newData);
            // const persistencePromise: IOutput = {
            //   receivedItem: 0,
            //   result: 0,
            //   selectedItem: input.selectedItem,
            //   sentItem: input.item, //| input.sentItem,
            // };
            // console.log(persistencePromise);
            return 0;
          })
          .then((output) => {
            let received;
            if (Array.isArray(output))
              received = output.map((cOutput) => cOutput.dataValues);
            else received = output.dataValues;
            if (method.includes('destroy') || method.includes('update'))
              received = output;

            // if (method.includes('update')) {
            //   console.log('METHOD:', method);
            //   console.log('OUTPUT END:', output);
            //   received = output;
            // }

            const persistencePromise: IOutput<unknown, unknown, unknown> = {
              receivedItem: received,
              result: received,
              selectedItem: input.selectedItem,
              sentItem: input.item, //| input.sentItem,
            };
            // console.log(persistencePromise);
            resolve(persistencePromise);
          })
          .catch((error) => {
            reject(error);
          })
      : element
          .then((output) => {
            let received;
            if (Array.isArray(output))
              received = output.map((cOutput) => cOutput.dataValues);
            else received = output.dataValues;
            if (method.includes('destroy') || method.includes('update'))
              received = output;

            // if (method.includes('update')) {
            //   console.log('OUTPUT:', output);
            //   console.log('received:', received);
            // }

            // if (method.includes('update')) {
            //   console.log('METHOD:', method);
            //   console.log('OUTPUT:', output);
            //   received = output;
            // }

            const persistencePromise: IOutput<unknown, unknown, unknown> = {
              receivedItem: received,
              result: received,
              selectedItem: input.selectedItem,
              sentItem: input.item, //| input.sentItem,
            };
            // console.log(persistencePromise);
            resolve(persistencePromise);
          })
          .catch((error) => {
            reject(error);
          });
  }

  private makePromise(
    input: IInput<unknown, unknown>,
    method: string
  ): Promise<IOutput<unknown, unknown, unknown>> {
    return new Promise((resolve, reject) => {
      this.persistencePromise(input, method, resolve, reject);
    });
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
