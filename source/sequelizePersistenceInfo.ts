/* eslint-disable @typescript-eslint/no-explicit-any */
// file deepcode ignore no-any: any needed
import { Info, PersistenceInfo } from 'flexiblepersistence';
import { SenderReceiver } from 'journaly';
import { Options } from 'sequelize/types';

export class SequelizePersistenceInfo extends PersistenceInfo {
  sequelizeOptions?: Options;

  constructor(
    info: Info,
    journaly: SenderReceiver<any>,
    sequelizeOptions?: Options
  ) {
    super(info, journaly);
    this.sequelizeOptions = sequelizeOptions;
  }
}
