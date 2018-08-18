require('dotenv').config();

console.log(process.env.PASSWORD);
const Sequelize = require('sequelize');

const sequelize = new Sequelize('stray_cat', 'root', process.env.PASSWORD, {
    host: '127.0.0.1',
    port: '3306',
    dialect: 'mysql',
});


const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));


const User = sequelize.define('user', {
    username: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    password: {
        type: Sequelize.STRING,
    },
    channels: {
        type: Sequelize.STRING,
    },
    nick: {
        type: Sequelize.STRING,
    },
});


const cats = sequelize.define('cats', {
    name: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    sounds: {
        type: Sequelize.STRING,
    },
    catch: {
        type: Sequelize.STRING,
    },
    msgs: {
        type: Sequelize.STRING,
    },
    responses: {
        type: Sequelize.STRING,
    },
});

const ignore = sequelize.define('ignore', {
    channel: {
        type: Sequelize.STRING,
    },
    nick: {
        type: Sequelize.STRING,
    },
    net: {
        type: Sequelize.STRING,
    },
});

const resps = sequelize.define('resp', {
    name: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    catch: {
        type: Sequelize.STRING,
    },
    msgs: {
        type: Sequelize.STRING,
    },
});

module.exports = {

    login(email, password) {
        return User.findOne({ where: { email } }).then((user) => {
            console.log(user.password);
            return bcrypt.compareAsync(password, user.password).then((tmp) => {
                console.log(tmp);
                if (tmp) {
                    return user;
                }
                return false;
            });
        });
    },
    getCat(cat) {
        return cats.findOne({ where: { name: cat } }).then((cat) => {
            if (!cat) {
                return cats.findOne({ name: 'generic' }).then(cat => cat.toJSON());
            }
            return cat.toJSON();
        });
    },
    ignore: {
        add(client, channel, message) {
            // client.net
            return ignore.create({ nick: message.split(' ')[3], net: client.net, channel }).then(res => true);
        },
        remove(client, channel, message) {
            return ignore.findOne({ where: { nick: message.split(' ')[3], channel, net: client.net } }).then(res => res.destroy());
        },
        get(net) {
            return ignore.findAll({ net }).then(res => res);
        },
    },
    getResp(name) {
        return resps.findOne({ where: { name } }).then((resp) => {
            if (!resp) {
                return null;
            }
            return resp.toJSON();
        });
    },


    // login("admin@bludotos.com", "@pfelor@nge1!");

};
