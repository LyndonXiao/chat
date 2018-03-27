const bodyParser = require('body-parser'),
    express = require('express'),
    path = require('path'),
    query = require('./mysql_pool'),
    moment = require('moment'),
    helper = require('./helper');

const app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Put all API endpoints under '/api'
app.post('/api/login', (req, res) => {
    const params = req.body;

    console.log(params)
    //缺少参数
    if (params.length <= 0) {
        res.json(helper.json(101, 'params missing'));
        return;
    }

    const username = params.username;
    const password = params.password;

    var sql = 'select user_id, password, salt from users where user_name = ? limit 1';
    query(sql, [username], function (err, result, fields) {
        if (err) {
            res.json(helper.json(202, "unexpected error: " + err.message));
            return;
        }

        //没找到用户
        if (!result) {
            res.json(helper.json(201, "user not found"));
            return;
        }

        //验证成功
        if (result && result[0].password == helper.aesEncode(password, result[0].salt)) {
            //更新token
            var token = helper.randomString(32);
            var sql = 'update users set token = ? where user_id = ?;';
            query(sql, [token, result[0].user_id], function (err, result, fields) {
                if (err) {
                    res.json(helper.json(202, 'unexpected error:' + err.message));
                    return;
                }

                if (result.length <= 0) {
                    res.json(helper.json(201, 'server busy, try later'));
                    return;
                } else {
                    res.json(helper.json(200, 'login success', { token: token }));
                    return;
                }
            })
            return;
        }

        //账号密码错误
        res.json(helper.json(201, 'username or password uncorrect'))
        return;
    });
});

//注册用户
app.post('/api/register', (req, res) => {
    const params = req.body;

    console.log(params)
    //缺少参数
    if (params.length <= 0
        || !params.username || !params.password
        || (params.username && params.username.length <= 0)
        || (params.password && params.password.length <= 0)) {
        res.json(helper.json(101, 'params missing'));
        return;
    }

    const username = params.username;
    const password = params.password;

    var sql = 'select user_id from users where user_name = ?';
    query(sql, [username], function (err, result, fields) {
        if (err) {
            res.json(helper.json(202, 'unexpected error:' + err.message));
            return;
        }

        if (result.length > 0) {//已存在用户名
            res.json(helper.json(201, 'username had been token, change another one pls'));
            return;
        } else {//不存在
            var salt = helper.randomString(4);
            var encrypt_password = helper.aesEncode(password, salt);//密码可逆加密

            var sql = "Insert into users(user_name, password, salt) values(?, ?, ?)";
            query(sql, [username, encrypt_password, salt], function (err, result, fields) {
                if (err) {
                    res.json(helper.json(202, 'unexpected error:' + err.message));
                    return;
                }

                if (result.length <= 0) {
                    res.json(helper.json(201, 'server busy, try later'));
                    return;
                } else {
                    res.json(helper.json(200, 'register success'));
                    return;
                }
            })
        }
    });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

const port = process.env.PORT || 5000;
server.listen(port);
console.log(`server listening on ${port}`);

//在线用户
var online_users = [];

//socket部分
io.on('connection', function (socket) {
    //登录
    socket.on('login', function (user_token) {
        console.log('login...');

        var sql = 'select user_id, user_name, user_avatar, nickname from users where token = ?';
        query(sql, [user_token], function (err, result, fields) {
            if (err) {
                socket.emit('login_error', "unexpected error: " + err.message)
                return;
            }

            //没找到用户
            if (result.length <= 0) {
                socket.emit('login_error', "user not found");
                return;
            }
            else {
                const user_id = result[0].user_id;
                const username = result[0].user_name;
                if (online_users[user_id] !== undefined) {
                    socket.to(online_users[user_id]).emit('force_disconnect');
                    console.log('user ' + username + ' login at other place');
                }
                socket.user_id = user_id;
                online_users[user_id] = socket.id;
                socket.emit('login_success', result[0]);
                io.sockets.emit('system', username, Object.keys(online_users).length, 'login');
                return;
            }
        });
    });
    //断开连接的事件
    socket.on('disconnect', function () {
        console.log('disconnect...');
        //将断开连接的用户从users中删除
        delete (online_users[socket.user_id]);
        //通知除自己以外的所有人
        // socket.broadcast.emit('system', socket.username, Object.keys(online_users).length, 'logout');
    });

    //接收新消息
    socket.on('postMsg', function (msg, toUser) {
        console.log('postMsg...');
        if (toUser) {
            var sql = 'insert into message(from_user, to_user, content, type) values(?, ?, ?, ?);';
            query(sql, [socket.user_id, toUser, msg, 1], function (err, result, fields) {
                if (err) {
                    console.log('unexpected error:' + err.message);
                }

                if (result.length <= 0) {
                    console.log('server busy, try later')
                } else {
                    console.log('message insert success');
                }
            });
            socket.to(online_users[toUser]).emit('newMsg', socket.user_id, msg);
        } else {
            //将消息发送到除自己外的所有用户
            socket.broadcast.emit('newMsg', socket.user_id, msg);
        }
    });
    //接收用户发来的图片
    socket.on('postImg', function (imgData, color, toUser) {
        console.log('postImg...');
        //通过一个newImg事件分发到除自己外的每个用户
        if (toUser) {
            socket.to(online_users[toUser]).emit('newImg', socket.username, imgData, color);
        } else {
            socket.broadcast.emit('newImg', socket.username, imgData, color);
        }
    });

    //获取和指定用户的历史聊天记录
    socket.on('history', function (withUser, page = 1) {
        console.log('history...');
        var paget_size = 15;
        var offset = (page - 1) * paget_size;
        if (withUser.length <= 0)
            socket.emit('history_error', 'params missing');

        var user_id = socket.user_id;
        var sql = 'SELECT CASE WHEN to_user = ? THEN 0 WHEN from_user = ? THEN 1 END AS self, content, type, status, created_at FROM message where (from_user = ? and to_user = ?) or (from_user = ? and to_user = ?) ORDER BY created_at DESC limit ?, ?;';
        query(sql, [user_id, user_id, user_id, withUser, withUser, user_id, offset, paget_size], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_error', 'unexpected error:' + err.message);
            }

            var messages = [];
            if (result.length <= 0)
                socket.emit('history_error', '无记录');

            else {
                result.forEach(value => {
                    var message = {
                        text: value.content,
                        date: moment(value.created_at).format('YYYY-MM-DD HH:mm:ss'),
                        self: value.self,
                        unRead: value.status
                    }
                    messages.push(message);
                })
                socket.emit('history_success', withUser, messages);
            }
        })
    });

    //获取历史会话列表
    socket.on('history_list', function () {
        console.log('history_list...');
        var user_id = socket.user_id;
        var sql = 'SELECT u.user_id, u.user_name, a.created_at as timestamp FROM ( SELECT CASE WHEN to_user = ? THEN from_user WHEN from_user = ? THEN to_user END AS user_id, created_at FROM message ORDER BY created_at DESC ) AS a JOIN users u ON u.user_id = a.user_id left join (select count(id) as unread_num, from_user as user_id from message where to_user = ? group by from_user) as b on b.user_id = a.user_id GROUP BY a.user_id';
        query(sql, [user_id, user_id, user_id], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_list_error', 'unexpected error:' + err.message);
            }

            if (result.length <= 0)
                socket.emit('history_list_error', '无记录');
            else {
                result.map((item, k) => {
                    item.timestamp = moment().unix();
                })
                socket.emit('history_list_success', result);
            }
        });
    });

    //获取好友列表
    socket.on('friend_list', function () {
        console.log('frined_list...');
        var user_id = socket.user_id;
        var sql = 'SELECT u.user_id, u.user_name, u.nickname, u.user_avatar FROM friends f join users u on u.user_id = f.friend_id where f.user_id = ?';
        query(sql, [user_id], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_list_error', 'unexpected error:' + err.message);
            }

            if (result.length <= 0)
                socket.emit('friend_list_error', '无记录');
            else
                socket.emit('friend_list_success', result);
        });
    });

    //消息已读
    socket.on('message_read', function(withUser) {
        var sql = 'Update message set status = 0 where from_user = ?';
        query(sql, [withUser], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_list_error', 'unexpected error:' + err.message);
            }
            
            if (result.length <= 0)
                socket.emit('message_read_error', '无记录');
            else
                socket.emit('message_read_success', withUser);
        });
    });
});