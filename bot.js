require('dotenv').config();
const irc = require('irc');

var pm2 = require('pm2');

pm2.running = false;

const cats = {};

const client = new irc.Client('irc.rizon.net', 'stray_cat', {
  port: 6667,
  debug: true,
  channels: ['#test_irc'],
  userName: 'stray_cat',
  realName: 'stray_cat',
});
client.on('message', (from, to, message) => {
  if (from.toLowerCase() === 'nyankochan' && message.split(' ')[0] === '.stray_cat') {
    const msg = message.match(/\s(.+?$)/) != null ? message.match(/\s(.+?$)/)[1] : '';
    if (msg.split(',')[0] === 'start') {
      const catName = msg.split(',')[1];
      const catServer = msg.split(',')[2].split(' ')[0];
      const catChannels = msg.split(',')[2].split(' ')[1].substr(1).split(':');
      if (!cats[catName]) {
        pm2.connect(function (err) {
          if (err) {
            console.error(err); // eslint-disable-line no-console
            // process.exit(2);
            pm2.disconnect(); // Disconnects from PM2
            return;
          }
          pm2.start({
            name: `stray_cat_child_${catName}`,
            script: 'cat.js', // Script to be run
            exec_mode: 'cluster', // Allows your app to be clustered
            instances: 1, // Optional: Scales your app by 4
            max_memory_restart: '100M', // Optional: Restarts your app if it reaches 100Mo
            args: `${catName} ${catServer} ${catChannels.join(' ')}`,
          }, function (error, app) {
            cats[catName] = app;
            pm2.disconnect(); // Disconnects from PM2
            if (err) throw err;
          });
        });
      } else {
        client.say(to, 'this cat is already stray!');
      }
    }
    if (msg.split(',')[0] === 'quit') {
      if (cats[msg.split(',')[1]]) {
        const tmpName = msg.split(',')[1];
        pm2.connect(function (err) {
          if (err) {
            console.error(err); // eslint-disable-line no-console
            // process.exit(2);
            pm2.disconnect(); // Disconnects from PM2
            return;
          }
          pm2.stop(`stray_cat_child_${tmpName}`, function (error) {
            if (error) {
              console.log(error); // eslint-disable-line no-console
              return;
            }
            delete cats[tmpName];
            delete cats[tmpName];
          });
          // setTimeout(function() {startCat()}, 3000);
        });
      } else {
        client.say(to, 'This cat isnt a stray!');
      }
    }
    /* if (msg.split(" ")[0] == "`stray" && msg.split(" ")[1] == "quit") {
                        //client__.say(to, "PONG!");
                        clients[tmp_name].disconnect("bye bye!", function() {
                            delete cats[tmp_name];
                            delete clients[tmp_name];
                        });
                    } */
    if (msg.split(' ')[0] === 'strays') {
      // client__.say(to, "PONG!");
      client.say(to, JSON.stringify(cats));
    }
  }
});
