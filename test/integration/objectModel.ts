import { DataTypes } from 'sequelize';
import BaseModelDefault from '../../source/baseModelDefault';

export default class ObjectModel extends BaseModelDefault {
  protected name = 'Object';
  protected attributes = {
    // Model attributes are defined here
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    test: {
      type: DataTypes.STRING(100),
    },
    testNumber: {
      type: DataTypes.DECIMAL,
      // allowNull defaults to true
    },
  };

  protected options = {
    timestamps: false,
  };
}
