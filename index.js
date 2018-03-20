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
    socket.on('login', function (username, password) {
        if (username.length <= 0 || password.length <= 0) {
            socket.emit('login_error', 'login params missing');
        }

        var sql = 'select password, salt from users where user_name = ?';
        query(sql, [username], function (err, result, fields) {
            if (err) {
                socket.emit('login_error', "unexpected error: " + err.message)
                return;
            }

            //没找到用户
            if (!result) {
                socket.emit('login_error', "user not found");
                return;
            }

            if (result && result[0].password == helper.aesEncode(password, result[0].salt)) {
                if (online_users[username] !== undefined) {
                    socket.username = username + '_wait_log_out';
                    online_users[socket.username] = socket.id;
                    socket.to(online_users[username]).emit('force_disconnect');
                    console.log('user ' + username + ' login at other place');
                }
                socket.username = username;
                online_users[username] = socket.id;
                socket.emit('login_success');
                io.sockets.emit('system', username, Object.keys(online_users).length, 'login');
                return;
            }

            //账号密码错误
            socket.emit('login_error', "password not match")
            return;
        });
    });
    //断开连接的事件
    socket.on('disconnect', function () {
        //将断开连接的用户从users中删除
        delete (online_users[socket.username]);
        //通知除自己以外的所有人
        // socket.broadcast.emit('system', socket.username, Object.keys(online_users).length, 'logout');
    });

    //接收新消息
    socket.on('postMsg', function (msg, color, toUser) {
        //将消息发送到除自己外的所有用户
        if (toUser) {
            var sql = 'insert into message(from_username, to_username, content, type) values(?, ?, ?, ?);';
            query(sql, [socket.username, toUser, msg, 1], function (err, result, fields) {
                if (err) {
                    console.log('unexpected error:' + err.message);
                }

                if (result.length <= 0) {
                    console.log('server busy, try later')
                } else {
                    console.log('message insert success');
                }
            });
            socket.to(online_users[toUser]).emit('newMsg', socket.username, msg, color);
        } else {
            socket.broadcast.emit('newMsg', socket.username, msg, color);
        }
    });
    //接收用户发来的图片
    socket.on('postImg', function (imgData, color, toUser) {
        //通过一个newImg事件分发到除自己外的每个用户
        if (toUser) {
            socket.to(online_users[toUser]).emit('newImg', socket.username, imgData, color);
        } else {
            socket.broadcast.emit('newImg', socket.username, imgData, color);
        }
    });
    //获取和指定用户的历史聊天记录
    socket.on('history', function (withUser, page = 1) {
        var paget_size = 15;
        var offset = (page - 1) * paget_size;
        if (withUser.length <= 0)
            socket.emit('history_error', 'params missing');

        var username = socket.username;
        var sql = 'select from_username, to_username, content, type, created_at from message where (from_username = ? and to_username = ?) or (from_username = ? and to_username = ?) order by created_at desc limit ?, ?;';
        query(sql, [username, withUser, withUser, username, offset, paget_size], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_error', 'unexpected error:' + err.message);
            }

            socket.emit('history_success', result);
        })
    });

    socket.on('history_list', function () {
        var username = socket.username;
        var unread_subSql = 'select count(id) as unread_num, from_username as username from message group by from_username where to_username = ?';
        var sql = 'select a.*, IFNULL(u.unread_num, 0) as unread_num from (SELECT DISTINCT CASE WHEN to_username = ? THEN from_username WHEN from_username = ? THEN to_username END AS username, content, type, created_at FROM message ORDER BY created_at desc) as a left join (' + unread_subSql + ') as u on u.username = a.username GROUP BY username';
        query(sql, [username, username, username], function (err, result, fields) {
            if (err) {
                console.log('unexpected error:' + err.message);
                socket.emit('history_list_error', 'unexpected error:' + err.message);
            }

            socket.emit('history_list_success', result);
        })
    });
});