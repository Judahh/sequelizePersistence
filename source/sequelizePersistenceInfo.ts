// file deepcode ignore no-any: any needed
import { Info, PersistenceInfo } from 'flexiblepersistence';
import { SubjectObserver } from 'journaly';
import { Options } from 'sequelize/types';

export class SequelizePersistenceInfo extends PersistenceInfo {
  sequelizeOptions?: Options;

  constructor(
    info: Info,
    journaly: SubjectObserver<any>,
    sequelizeOptions?: Options
  ) {
    super(info, journaly);
    this.sequelizeOptions = sequelizeOptions;
  }
}
