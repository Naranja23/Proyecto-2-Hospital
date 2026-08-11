const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('messi', 'naranja', '1239', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres' 
});   

module.exports = {
  sequelize,
};