const db = require('../config/db');

const getBlockDemandByRange = async (start, end, interval) => {
    let groupByClause = '';
    switch (interval) {
        case '5min':
            groupByClause = 'DATE_FORMAT(time_slot, "%Y-%m-%d %H:%i:00")';
            break;
        case 'hourly':
            groupByClause = 'DATE_FORMAT(time_slot, "%Y-%m-%d %H:00:00")';
            break;
        case 'daily':
            groupByClause = 'DATE(time_slot)';
            break;
        default:
            throw new Error('Invalid interval');
    }

    const [rows] = await db.query(`
        SELECT block_id, block_name, ${groupByClause} AS time_group, MAX(max_demand) AS max_demand
        FROM block_5min_max_demand
        WHERE time_slot BETWEEN ? AND ?
        GROUP BY block_id, block_name, time_group
        ORDER BY block_id, time_group
    `, [start, end]);

    return rows;
};

module.exports = {
    getBlockDemandByRange,
};
