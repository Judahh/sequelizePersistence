/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// file deepcode ignore object-literal-shorthand: annoying
/* eslint-disable @typescript-eslint/no-explicit-any */
// file deepcode ignore no-any: any needed
import {
  PersistenceAdapter,
  PersistenceInfo,
  PersistencePromise,
  // RelationValueDAODB,
  // SelectedItemValue,
  PersistenceInputCreate,
  PersistenceInputUpdate,
  PersistenceInputRead,
  PersistenceInputDelete,
  PersistenceInput,
} from 'flexiblepersistence';
import { Sequelize } from 'sequelize';
import BaseModelDefault from './baseModelDefault';
import { SequelizePersistenceInfo } from './sequelizePersistenceInfo';
import Utils from './utils';
import { Pool } from 'pg';
export class SequelizeDB implements PersistenceAdapter {
  private persistenceInfo: SequelizePersistenceInfo;
  private sequelize;

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
      this.sequelize = this.persistenceInfo.sequelizeOptions
        ? new Sequelize(
            this.persistenceInfo.uri,
            this.persistenceInfo.sequelizeOptions
          )
        : new Sequelize(this.persistenceInfo.uri);
    } else throw new Error('Database URI nonexistent.');
    if (element) this.setElement(element);
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

  protected realInput(input: PersistenceInput<any>) {
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
    input: PersistenceInput<any>,
    method: string,
    resolve,
    reject
  ) {
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

    // const element = data
    //   ? this.persistenceInfo.journaly.publish(
    //       input.scheme + '.' + method,
    //       data,
    //       {
    //         where: input.selectedItem,
    //       }
    //     )
    //   : this.persistenceInfo.journaly.publish(input.scheme + '.' + method, {
    //       where: input.selectedItem,
    //     });

    // console.log('MODEL:', this.sequelize.models[input.scheme]);

    const element = data
      ? this.sequelize.models[input.scheme][method](data, {
          where: input.selectedItem,
          truncate: input.selectedItem ? undefined : true,
        })
      : this.sequelize.models[input.scheme][method]({
          where: input.selectedItem,
          truncate: input.selectedItem ? undefined : true,
        });
    singleDeleteOrUpdate
      ? element
          .then((output) => {
            // console.log('OUTPUT MID:', output);
            // console.log('OUTPUT receivedMethod:', receivedMethod);
            if (output) return output[receivedMethod](newData);
            // const persistencePromise: PersistencePromise = {
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

            const persistencePromise: PersistencePromise<any> = {
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
            //   console.log('METHOD:', method);
            //   console.log('OUTPUT:', output);
            //   received = output;
            // }

            const persistencePromise: PersistencePromise<any> = {
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
    input: PersistenceInput<any>,
    method: string
  ): Promise<PersistencePromise<any>> {
    return new Promise((resolve, reject) => {
      this.persistencePromise(input, method, resolve, reject);
    });
  }
  other(input: PersistenceInput<any>): Promise<PersistencePromise<any>> {
    return new Promise<PersistencePromise<any>>((resolve) => {
      resolve(
        new PersistencePromise({
          receivedItem: input,
        })
      );
    });
  }
  correct(
    input: PersistenceInputUpdate<any>
  ): Promise<PersistencePromise<any>> {
    //! Envia o input para o service determinado pelo esquema e lá ele faz as
    //! operações necessárias usando o journaly para acessar outros DAOs ou
    //! DAOs.
    //! Sempre deve-se receber informações do tipo input e o output deve ser
    //! compatível com o input para pemitir retro-alimentação.
    //! Atualizar o input para que utilize o melhor dos dois
    //! (input e parametros usados no SimpleAPI).
    return this.update(input);
  }

  nonexistent(input: PersistenceInputDelete): Promise<PersistencePromise<any>> {
    return this.delete(input);
  }

  existent(
    input: PersistenceInputCreate<any>
  ): Promise<PersistencePromise<any>> {
    return this.create(input);
  }

  create(input: PersistenceInputCreate<any>): Promise<PersistencePromise<any>> {
    // console.log('CREATE:', input);
    return Array.isArray(input.item)
      ? this.makePromise(input, 'bulkCreate')
      : this.makePromise(input, 'create');
  }
  update(input: PersistenceInputUpdate<any>): Promise<PersistencePromise<any>> {
    return input.single
      ? this.makePromise(input, 'updateOne')
      : this.makePromise(input, 'update');
  }
  read(input: PersistenceInputRead): Promise<PersistencePromise<any>> {
    // console.log('read', input);
    return input.single
      ? this.makePromise(input, 'findOne')
      : this.makePromise(input, 'findAll');
  }
  delete(input: PersistenceInputDelete): Promise<PersistencePromise<any>> {
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
    return new Promise<boolean>((resolve) => {
      this.end(resolve);
    });
  }

  private end(resolve): void {
    this.sequelize.close(() => {
      resolve(true);
    });
  }
}
