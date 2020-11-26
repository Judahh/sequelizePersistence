import { Handler } from 'flexiblepersistence';

export default interface DatabaseInitializer {
  eventHandler?: Handler;
  sequelize?;
  hasMemory?: boolean;
}
