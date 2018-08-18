var irc = require('irc');
var db = require('./db');

var tmp = process.argv;
tmp.splice(0, 2);
args = {
  name: tmp[0],
  server: tmp[1],
  channels: tmp.slice(2),
};

var name = args.name;
var server = args.server;
var channels = args.channels;
db.getCat(name).then(function (cat_) {
  var loadlist = JSON.parse(cat_.responses);
  var cat = new irc.Client(server, name, {
    port: 6667,
    debug: true,
    channels: channels,
    userName: name,
    realName: name,
  });
  cat.net = server.split('.')[1];
  var timeout;
  var meows = JSON.parse(cat_.sounds);
  var messages = JSON.parse(cat_.msgs);
  var chanIndex = Math.round(Math.random() * (channels.length - 1));
  var msgIndex = Math.round(Math.random() * (messages.length - 1));
  var randomTime = Math.round(Math.random() * (86400000 / 4));
  var randomMsg = function () {
    timeout = setTimeout(function () {
      cat.send('PRIVMSG', channels[chanIndex], messages[msgIndex]);
      randomTime = Math.round(Math.random() * (86400000 / 4));
      chanIndex = Math.round(Math.random() * (channels.length - 1));
      msgIndex = Math.round(Math.random() * (messages.length - 1));
      randomMsg();
    }, randomTime);
  };
  randomMsg();
  cat.on('registered', (from, to, message) => { // eslint-disable-line
    // if(message.toLowerCase().indexOf("this nickname is registered") != -1) {
    cat.say('NickServ', 'identify ' + process.env.PASSWORD);
    // }
  });

  // functions
  var resps = {};
  var loadResp = function (respName) {
    return db.getResp(respName).then(function (resp) {
      if (resp) {
        resp.catch = new RegExp(resp.catch.replace(/\{\{cat\}\}/g, name));
        resp.msgs = JSON.parse(resp.msgs);
        resps[respName] = resp;
        return 'response loaded!';
      }
      return 'there was an error!';
    });
  };

  setTimeout(function () {
    loadlist.forEach(function (func) {
      console.log('Loading: ' + func + '....'); // eslint-disable-line no-console
      loadResp(func).then(function (msg) {
        console.log(msg); // eslint-disable-line no-console
      });
    });
  }, 5000);
  var ignoreList = {};
  db.ignore.get(cat.net).then(function (list) {
    list.forEach(function (item) {
      ignoreList[item.nick] = item.nick;
    });
  });
  var removeResp = function (respName) { // eslint-disable-line
    if (resps[respName]) {
      delete resps[respName];
    }
  };
  var listener1 = function (from, to, message) {
    if (message.substr(0, 4) === 'ping' && message.length === 4) {
      cat.say(to, 'PONG!');
    }
    Object.keys(resps).forEach(function (key) {
      if (message.match(resps[key].catch) != null) {
        var respMsgIndex = Math.round(Math.random() * (resps[key].msgs.length - 1));
        if ((typeof resps[key].msgs[respMsgIndex]).toString().toLowerCase() === 'string') {
          cat.say(to, resps[key].msgs[respMsgIndex].replace('[nick]', from));
        } else {
          for (var j in resps[key].msgs[respMsgIndex]) { // eslint-disable-line
            cat.say(to, resps[key].msgs[respMsgIndex][j].replace('[nick]', from));
          }
        }
      }
    });
    if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'update') {
      db.getCat(name).then(function (tmpCat) {
        messages = JSON.parse(tmpCat.msgs);
        meows = JSON.parse(tmpCat.sounds);
        tmpRe = JSON.parse(tmpCat.catch);
        re = new RegExp(tmpRe[0], tmpRe[1]);
        cat.say(from, 'messages: ' + tmpCat.msgs);
        cat.say(from, 'sounds: ' + tmpCat.sounds);
        cat.say(from, 'regex: ' + tmpCat.catch);
      });
    }
  };
  var listener2 = function (from, to, message) {
    var tmpRe = JSON.parse(cat_.catch);
    var re = new RegExp(tmpRe[0], tmpRe[1]);
    if (message.split(' ')[0].match(re) != null && !ignoreList[from]) {
      cat.say(to, meows[Math.round(Math.random() * (meows.length - 1))]);
    }
    if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'ignore' && (from.toLowerCase() === 'nyanko' || from.toLowerCase() === 'nyankochan')) {
      db.ignore[message.split(' ')[2]](cat, to, message).then(function (res) {
        console.log(res); // eslint-disable-line no-console
      });
      if (message.split(' ')[2] === 'add') {
        ignoreList[message.split(' ')[3]] = message.split(' ')[3];
      }
      if (message.split(' ')[2] === 'remove') {
        delete ignoreList[message.split(' ')[3]];
      }
    }
    if (from.toLowerCase() === 'nyanko' || from.toLowerCase() === 'nyankochan') {
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'time') {
        cat.say(to, 'num: ' + chanIndex + ' to: ' + JSON.stringify(channels) + ' time:' + randomTime);
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'nick') {
        cat.send('NICK', message.split(' ')[2]);
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'test') {
        // UNCOMMENT ME cat.send("PRIVMSG", to, "\001ACTION test \001");
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'killtime') {
        // cat.say(to, "to: "+channels[chanIndex]+" time:"+randomTime);
        clearTimeout(timeout);
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'recalc') {
        // cat.say(to, "to: "+channels[chanIndex]+" time:"+randomTime);
        clearTimeout(timeout);
        randomTime = Math.round(Math.random() * (86400000 / 4));
        randomMsg();
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'load') {
        loadResp(message.split(' ')[2]).then(function (resp) {
          cat.say(to, resp);
        });
      }
      if (message.split(' ')[0] === '`stray' && message.split(' ')[1] === 'getresps') {
        cat.say(to, JSON.stringify(resps));
      }
    }
  };
  cat.on('message', listener2);
  cat.on('action', listener1);
  return true;
});
