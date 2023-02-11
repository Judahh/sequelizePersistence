import { ITransaction } from 'flexiblepersistence';
import { Sequelize, Transaction as T, TransactionOptions } from 'sequelize';

export class Transaction implements ITransaction {
  private transaction?: T;
  private sequelize: Sequelize;
  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }
  async begin(options?: TransactionOptions): Promise<void> {
    this.transaction = await this.sequelize.transaction(options);
  }
  async commit(): Promise<void> {
    return this.transaction?.commit();
  }
  async rollback(): Promise<void> {
    return this.transaction?.rollback();
  }
}
