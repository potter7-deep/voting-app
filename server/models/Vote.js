const { DataTypes } = require('sequelize');

const Vote = (sequelize) => {
  const Vote = sequelize.define('Vote', {
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
    coalitionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'coalition_id',
      references: {
        model: 'coalitions',
        key: 'id'
      }
    },
    voterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'voter_id',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'votes',
    timestamps: true,
    createdAt: 'voted_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['election_id', 'voter_id']
      }
    ]
  });

  return Vote;
};

module.exports = Vote;

