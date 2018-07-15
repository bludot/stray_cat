require('dotenv').config();

var db = require('./db');
var irc = require('irc');



var client = new irc.Client("irc.rizon.net", 'stray_cat', {

                port: 6667,

                debug: true,

                channels: ["#test_irc"],

                userName: 'stray_cat',

                realName: 'stray_cat'

            });

    var clients = {};

    var cats = {};

    var startCat = function(name, server, channels) {

        var name = name;

        var server = server;

        var channels = channels;

        var cat_ = db.getCat(name).then(function(cat_) {

        var loadlist = JSON.parse(cat_.responses);

            if (!clients[name]) {

                var client__ = new irc.Client(server, 'stray_cat_'+name, {

                    port: 6667,

                    debug: true,

                    channels: channels,

                    userName: 'stray_cat_'+name,

                    realName: 'stray_cat_'+name

                });
				client__.net = server.split(".")[1];

                cats[name] = {

                    name: name,

                    server: server,

                    channels: channels

                };

                var timeout;

                var tmp_name = name;

                var meows = JSON.parse(cat_.sounds)

                var messages = JSON.parse(cat_.msgs);



                var chanIndex = Math.round(Math.random() * (channels.length - 1))

                var msgIndex = Math.round(Math.random() * (messages.length - 1));

                var randomTime = Math.round(Math.random() * (86400000 / 4));

                var randomMsg = function() {

                    timeout = setTimeout(function() {



                        client__.send("PRIVMSG", channels[chanIndex], messages[msgIndex]);

                        randomTime = Math.round(Math.random() * (86400000 / 4));

                        chanIndex = Math.round(Math.random() * (channels.length - 1));

                        msgIndex = Math.round(Math.random() * (messages.length - 1));

                        randomMsg();

                    }, randomTime);

                }

                randomMsg();

                client__.on('registered', (from, to, message) => {

                    //if(message.toLowerCase().indexOf("this nickname is registered") != -1) {

                        client__.say("NickServ", "identify " + process.env.PASSWORD);

                    //}

                })

                setTimeout(function() {

                 for(var i in loadlist) {

                    client__.say(channels[0], "Loading: "+loadlist[i]+"....");

                    load_resp(loadlist[i]).then(function(msg) {

                    client__.say(channels[0], msg);

                    })

                 }

                }, 5000);


				var ignoreList = {};
				db.ignore.get(client__.net).then(function(list) {
					for(var i in list) {
						ignoreList[list[i].nick] = list[i].nick;
					}
				});

                var resps = {};

                var load_resp = function(name) {

                    var name = name;

                    return db.getResp(name).then(function(resp) {

                        if(resp) {

                            resp.catch = new RegExp(resp.catch);

                            resp.msgs = JSON.parse(resp.msgs);

                            resps[name] = resp;

                            return "response loaded!";

                        } else {

                            return "there was an error!";

                        }

                    });

                };

                var remove_resp = function(name) {

                        if(resps[name]) {

                            delete resps[name];

                        }

                };

                var listener1 = function(from, to, message) {



                    /*if(message.substr(0, 4) == "ping" && message.length == 4) {

                        client__.say(to, "PONG!");

                    }*/



                    console.log(message);

                    for(var i in resps) {

                        if(message.match(resps[i].catch) != null) {

                            console.log("found a match!")

                            var resp_msgIndex = Math.round(Math.random() * (resps[i].msgs.length - 1));

                            if((typeof resps[i].msgs[resp_msgIndex]).toString().toLowerCase() == "string") {

                                client__.say(to, resps[i].msgs[resp_msgIndex].replace("[nick]", from));

                            } else {

                                for(var j in resps[i].msgs[resp_msgIndex]) {

                                    client__.say(to, resps[i].msgs[resp_msgIndex][j].replace("[nick]", from));

                                }

                            }

                        }

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "update") {

                        db.getCat(name).then(function(cat_) {

                            messages = JSON.parse(cat_.msgs);

                            meows = JSON.parse(cat_.sounds);

                            tmp_re = JSON.parse(cat_["catch"]);

                            re = new RegExp(tmp_re[0], tmp_re[1]);

                            client__.say(from, "messages: "+cat_.msgs);

                            client__.say(from, "sounds: "+cat_.sounds);

                            client__.say(from, "regex: "+cat_["catch"]);

                        });

                    }



                }

                var listener2 = function(from, to, message) {

                    var tmp_re = JSON.parse(cat_["catch"]);

                    var re = new RegExp(tmp_re[0], tmp_re[1]);

                    if (message.split(" ")[0].match(re) != null && !ignoreList[from]) {

                        client__.say(to, meows[Math.round(Math.random() * (meows.length - 1))]);

                    }



					if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "ignore" && (from.toLowerCase() == "nyanko" || from.toLowerCase() == "nyankochan")) {
						db.ignore[message.split(" ")[2]](client__, to, message).then(function(res) {
							console.log(res);
						});
						if(message.split(" ")[2] == "add") {
							ignoreList[message.split(" ")[3]] = message.split(" ")[3];
						}

						if(message.split(" ")[2] == "remove") {
							delete ignoreList[message.split(" ")[3]];
						}
					}


					if(from.toLowerCase() == "nyanko" || from.toLowerCase() == 'nyankochan') {

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "time") {

                        client__.say(to, "num: " + chanIndex + " to: " + JSON.stringify(channels) + " time:" + randomTime);

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "nick") {

                        client__.send("NICK", message.split(" ")[2]);

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "test") {

                        client__.send("PRIVMSG", to, "\001ACTION test \001");

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "killtime") {

                        //client__.say(to, "to: "+channels[chanIndex]+" time:"+randomTime);

                        clearTimeout(timeout);

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "recalc") {

                        //client__.say(to, "to: "+channels[chanIndex]+" time:"+randomTime);

                        clearTimeout(timeout);

                        randomTime = Math.round(Math.random() * (86400000 / 4));

                        randomMsg();

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "load") {

                        load_resp(message.split(" ")[2]).then(function(resp) {

                            client__.say(to, resp);

                        });

                    }

                    if (message.split(" ")[0] == "`stray" && message.split(" ")[1] == "getresps") {

                        client__.say(to, JSON.stringify(resps));

                    }

                }

            }

                client__.on('message', listener2);

                client__.on('action', listener1);

                clients[name] = client__;

                return true;

            } else {

                return false;

            }

        });





    }

    client.on('message', (from, to, message) => {



                if (from.toLowerCase() == "nyankochan" && message.split(" ")[0] == ".stray_cat") {

                    var msg = message.match(/\s(.+?$)/) != null ? message.match(/\s(.+?$)/)[1] : "";

                    console.log(msg);

                    console.log(msg.split(','))

                    if (msg.split(',')[0] == "start") {

                        if (!clients[msg.split(',')[1]]) {

                            startCat(msg.split(',')[1], msg.split(',')[2].split(" ")[0], msg.split(",")[2].split(" ")[1].substr(1).split(":"));

                        } else {

                            client.say(to, "this cat is already stray!");

                        }

                    }

                    if (msg.split(',')[0] == "quit") {

                        if (clients[msg.split(',')[1]]) {

                            var tmp_name = msg.split(',')[1];

                            clients[msg.split(',')[1]].disconnect("bye bye!", function() {

                                delete cats[tmp_name];

                                delete clients[tmp_name];

                                //setTimeout(function() {startCat()}, 3000);

                            })

                        } else {

                            client.say(to, "This cat isnt a stray!");

                        }

                    }
                    /*if (msg.split(" ")[0] == "`stray" && msg.split(" ")[1] == "quit") {



                        //client__.say(to, "PONG!");

                        clients[tmp_name].disconnect("bye bye!", function() {

                            delete cats[tmp_name];

                            delete clients[tmp_name];

                        });

                    }*/

                    if (msg.split(" ")[0] == "strays") {



                        //client__.say(to, "PONG!");

                        client.say(to, JSON.stringify(cats));

                    }

                }

        });

