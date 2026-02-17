const { DataTypes } = require('sequelize');

const Candidate = (sequelize) => {
  const Candidate = sequelize.define('Candidate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    coalitionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'coalition_id',
      references: {
        model: 'coalitions',
        key: 'id'
      }
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
      type: DataTypes.STRING(100),
      allowNull: false
    },
    position: {
      type: DataTypes.ENUM('chairperson', 'vice_chair', 'secretary', 'sports_person', 'treasurer', 'gender_representative'),
      allowNull: false
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'image_url'
    }
  }, {
    tableName: 'candidates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Candidate;
};

module.exports = Candidate;

