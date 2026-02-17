const { DataTypes } = require('sequelize');

const Coalition = (sequelize) => {
  const Coalition = sequelize.define('Coalition', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    electionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'election_id',
      references: {
        model: 'elections',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    symbol: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true
    }
  }, {
    tableName: 'coalitions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Coalition;
};

module.exports = Coalition;

