var Sequelize = require('sequelize');

var sequelize = new Sequelize('stray_cat', 'bludot', process.env.PASSWORD, {
    host: 'localhost',
    dialect: 'mysql'
})



var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));



var User = sequelize.define('user', {
    username: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    channels: {
        type: Sequelize.STRING
    },
    nick: {
        type: Sequelize.STRING
    }
});


var cats = sequelize.define('cats', {
    name: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    },
    sounds: {
        type: Sequelize.STRING
    },
    "catch": {
        type: Sequelize.STRING
    },
    msgs: {
        type: Sequelize.STRING
    },
    responses: {
        type: Sequelize.STRING
    }
});

var ignore = sequelize.define('ignore', {
	channel: {
		type: Sequelize.STRING
	},
	nick: {
		type: Sequelize.STRING
	},
	net: {
		type: Sequelize.STRING
	}
});

var resps = sequelize.define('resp', {
    name: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    },
    "catch": {
        type: Sequelize.STRING
    },
    msgs: {
        type: Sequelize.STRING
    }
});

module.exports = {

    login: function(email, password) {
        return User.findOne({'where': {'email': email}}).then(function(user) {
            console.log(user.password);
            return bcrypt.compareAsync(password, user.password).then(function(tmp) {
                    console.log(tmp);
                    if(tmp) {
                      return user;
                    } else {
                      return false;
                    }
                });
        });
    },
    getCat: function(cat) {
        return cats.findOne({'where': {'name': cat}}).then(function(cat) {
            if(!cat) {
                return cats.findOne({'name': 'generic'}).then(function(cat) {
                    return cat.toJSON();
                });
            } else {
                return cat.toJSON();
            }
        })
    },
	ignore: {
		add: function(client, channel, message) {
			//client.net
			return ignore.create({nick: message.split(" ")[3], net: client.net, channel: channel}).then(function(res) {
				return true;
			});
		},
		remove: function(client, channel, message) {
			return ignore.findOne({where: {nick: message.split(" ")[3], channel: channel, net: client.net}}).then(function(res) {
				return res.destroy();
			});
		},
		get: function(net) {
			return ignore.findAll({net: net}).then(function(res) {
				return res;
			});
		}
	},
    getResp: function(name) {
        return resps.findOne({'where': {'name': name}}).then(function(resp) {
            if(!resp) {
                return null;
            } else {
                return resp.toJSON();
            }
        })
    }




    //login("admin@bludotos.com", "@pfelor@nge1!");

}
