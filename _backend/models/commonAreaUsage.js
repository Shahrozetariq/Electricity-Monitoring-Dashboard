// models/commonAreaUsage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CommonAreaUsage = sequelize.define('CommonAreaUsage', {
    block_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    block_name: DataTypes.STRING,
    total_block_output: DataTypes.DOUBLE,
    total_tenant_usage: DataTypes.DOUBLE,
    common_area_usage: DataTypes.DOUBLE
}, {
    tableName: 'common_area_usage',
    timestamps: false,
    createdAt: false,
    updatedAt: false
});

module.exports = CommonAreaUsage;
