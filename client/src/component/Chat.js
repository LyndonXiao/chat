import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import moment from 'moment';
import { Scrollbars } from 'react-custom-scrollbars';
import Cookies from 'universal-cookie';
import io from 'socket.io-client';
import classnames from 'classnames';
import './Chat.css';

const cookies = new Cookies();
var socket = null;

class Card extends Component {
    render() {
        const user = this.props.user;
        return (
            <div className="m-card">
                <header>
                    <img alt="avatar" className="avatar" width="40" height="40" src={user.user_avatar} />
                    <p className="name">{user.nickname}</p>
                </header>
                <footer>
                    <div className='tab'>
                        <div className="tab-item" onClick={() => this.props.switchTabAction(0)}><a href="#"><i className={this.props.activeTab === 0 ? "tab-comment active" : "tab-comment"} /></a></div>
                        <div className="tab-item" onClick={() => this.props.switchTabAction(1)}><a href="#"><i className={this.props.activeTab === 1 ? "tab-contact active" : "tab-contact"} /></a></div>
                    </div>
                </footer>
            </div>
        );
    }
}

class List extends Component {

    sessionFriends() {
        const friends = this.props.friends;
        const sessions = this.props.sessions;
        var sessionFriends = [];
        sessions.forEach(item => {
            friends.forEach(frined => {
                if (frined.user_id === item.user_id) {
                    var sessionFriend = {
                        user_id: frined.user_id,
                        user_name: frined.user_name,
                        nickname: frined.nickname,
                        user_avatar: frined.user_avatar,
                        timestamp: item.timestamp,
                        unRead: item.unRead
                    }
                    sessionFriends.push(sessionFriend);
                }
            })
        })

        return sessionFriends;
    }

    render() {
        const withFriend = this.props.withFriend ? this.props.withFriend.user_id : null;
        var sessionFriends = [];
        if (this.props.activeTab === 0) {//会话列表
            sessionFriends = this.sessionFriends().sort((a, b) => b['timestamp'] - a['timestamp']);
        } else if (this.props.activeTab === 1) {//朋友列表
            sessionFriends = this.props.friends;
        }

        return (
            <div className="m-list">
                <ul>
                    {sessionFriends.map((value, index) =>
                        <li key={index} id={value.user_id} className={classnames({
                            'row':true,
                            'mainBetween':true,
                            'subCenter':true,
                            'active': this.props.activeTab === 0 && withFriend === value.user_id
                        })}  onClick={() => this.props.selectFriendAction(value.user_id)}>
                            <div className="row mainStart subCenter">
                                <img alt="avatar" className="avatar" width="30" height="30" src={value.user_avatar} />
                                <p className="name">{value.nickname}</p>
                            </div>
                            <i className="row mainCenter subCenter tag">{value.unRead}</i>
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}

class SessionHeader extends Component {
    render() {
        const friend = this.props.withFriend;

        return (
            <div className="session-title" style={{ display: this.props.activeTab !== 0 || !this.props.session ? 'none' : 'block' }}>
                {friend && this.props.activeTab === 0 && <header>
                    <img alt="avatar" className="avatar" width="30" height="30" src={friend.user_avatar} />
                    <p className="name">{friend.nickname}</p>
                </header>
                }
            </div>
        );
    }
}

class Message extends Component {

    componentDidMount() {
        const { scrollbars } = this.refs;
        scrollbars.scrollToBottom();
    }

    componentDidUpdate() {
        const { scrollbars } = this.refs;
        if (this.props.scrollToBottom)
            scrollbars.scrollToBottom();
    }

    session() {
        return this.state.sessions[this.state.sessionIndex];
    }

    render() {
        const session = this.props.session;
        const me = this.props.user;
        const friend = this.props.withFriend;
        var messages = this.props.activeTab !== 0 ? [] : (session ? session.messages : []);
        var timestamp = 0;
        messages = messages.map((item, k) => {
            const date = moment(item.date).unix();
            if ((date - timestamp) / 60 > 5) {
                item.showTime = true;
                timestamp = date;
            }
            return item;
        })
        return (
            <Scrollbars ref="scrollbars" style={{ width: '100%', height: 'calc(100% - 10pc - 51px)' }}
                autoHide
                autoHideTimeout={1000}
                autoHideDuration={200}>
                <div className="m-message">
                    <ul>
                        {
                            messages.map((value, index) =>
                                <li key={index}>
                                    {value.showTime && <p className="time"><span>{value.date}</span></p>}
                                    <div className={value.self ? 'main self' : 'main'}>
                                        <img alt="avatar" className="avatar" width="30" height="30" src={value.self ? me.user_avatar : friend.user_avatar} />
                                        <div className="text">{value.text}</div>
                                    </div>
                                </li>
                            )
                        }

                    </ul>
                </div>
            </Scrollbars>
        );
    }
}

class Text extends Component {

    render() {
        return (
            <div className="m-text" style={{ display: this.props.activeTab !== 0 || !this.props.session ? 'none' : 'block' }}>
                <textarea id='myInput' placeholder="按 Enter 发送" value={this.props.session ? this.props.session.myInput : ''} onInput={e => this.props.myInput(e)} disabled={this.props.activeTab !== 0 || !this.props.session ? true : false}></textarea>
            </div>
        );
    }
}

class Chat extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // 登录用户
            user: {},

            // 朋友列表
            friends: [],

            // 会话列表(与sessionFriends顺序一致)
            sessions: [],
            //进行中会话索引
            sessionIndex: -1,
            //是否滚动到底部
            scrollToBottom: true,
            //活动tab
            activeTab: 0,
            //是否已经登录
            isLogin: true,
        };
    }

    componentDidUpdate() {
        localStorage.setItem('sessions', JSON.stringify(this.state.sessions));
    }

    componentWillMount() {
        const user_token = cookies.get('user_token');
        var that = this;
        if (!user_token) {
            that.setState({
                isLogin: false,
            });
        } else {
            //建立socket连接
            socket = io();
            socket.on('connect', () => {
                console.log('connected');
                socket.emit('login', user_token);
            });
            socket.on('disconnect', (reason) => {
                console.log(reason);
            });
            //登录失败
            socket.on('login_error', function (msg) {
                alert(msg);
                that.setState({
                    isLogin: false,
                });
            });
            //登录成功
            socket.on('login_success', function (userInfo) {
                that.setState({
                    user: userInfo,
                });
                console.log('fetch history_list')
                //获取历史会话列表
                socket.emit('history_list');
                console.log('fetch friend_list')
                //获取好友列表
                socket.emit('friend_list');
            });
            //系统通知
            socket.on('system', function (user_name, userCount, type) {
                // var msg = user_name + (type === 'login' ? ' joined' : ' left');
                //指定系统消息显示为红色
                // that._displayNewMsg('system ', msg, 'red');
            });
            //新文字消息
            socket.on('newMsg', function (user_name, msg) {
                console.log('newMsg');
                var sessions = that.state.sessions;
                var session = sessions.filter(item => item.user_name === user_name);
                var friend = that.state.friends.filter(item => item.user_name === user_name);
                if (friend.length > 0) {
                    //在好友列表中
                    if (session.length > 0) {
                        //在会话中
                        session = session[0];
                        sessions[sessions.indexOf(session)].timestamp = moment().unix();
                        var message = {
                            date: moment().format('YYYY-MM-DD HH:mm:ss'),
                            text: msg,
                            self: false
                        }
                        sessions[sessions.indexOf(session)].messages.push(message);
                    } else {
                        //不在会话中
                        session = {
                            user_id: friend[0].user_id,
                            user_name: friend[0].user_name,
                            messages: [{
                                date: moment().format('YYYY-MM-DD HH:mm:ss'),
                                text: msg,
                                self: false
                            }],
                            timestamp: moment().unix(),
                        }

                        sessions.push(session);
                    }
                }

                that.setState({
                    sessions: sessions,
                });
            });
            //新图片消息
            socket.on('newImg', function (user, img) {
                // that._displayImage(user, img);
            });
            //获取和谁的历史聊天记录成功
            socket.on('history_success', function (withUser, data) {
                // console.log(data);
                var sessions = that.state.sessions;
                var session = sessions.filter(item => item.user_name === withUser);
                if (session.length > 0) {
                    session = session[0];
                    var messages = session.messages || [];
                    messages = messages.concat(data).sort((a, b) => moment(a['date']).unix() - moment(b['date']).unix());

                    sessions[sessions.indexOf(session)].messages = messages;
                    sessions[sessions.indexOf(session)].unRead = messages.filter(item => item.unRead === 1).length;
                    that.setState({
                        sessions: sessions,
                    });
                }
                //不考虑不在会话列表的历史记录
            });
            //获取和谁的历史聊天记录失败
            socket.on('history_error', function (msg) {
                console.log(msg)
            });
            //历史聊天列表获取成功
            socket.on('history_list_success', (data) => {
                if (data.length > 0) {
                    data.forEach((item, k) => {
                        data[k].messages = [];
                    })
                    that.setState({
                        sessions: data,
                    });
                    data.forEach((item, k) => {
                        socket.emit('history', item.user_name, 1);
                    })
                }
            })
            //历史聊天列表获取失败
            socket.on('history_list_error', (msg) => {
                console.log(msg);
            })
            //获取好友列表成功
            socket.on('friend_list_success', (data) => {
                if (data.length > 0) {
                    that.setState({
                        friends: data,
                    });
                }
            });
            //获取好友列表失败
            socket.on('friend_list_error', (msg) => {
                console.log(msg);
            });
            //强制断开连接
            socket.on('force_disconnect', function () {
                console.log('force_disconnect');
            });
        }
    }

    componentDidMount() {
        //设置输入监听
        document.getElementById('myInput').addEventListener('keyup', e => {
            var sessions = this.state.sessions;
            const friends = this.state.friends;
            const keycode = e.keyCode;
            const text = e.target.value.trim();
            if (keycode === 13 && text && this.state.sessionIndex >= 0) {
                sessions[this.state.sessionIndex].messages.push({
                    text: text,
                    date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    self: true
                });
                sessions[this.state.sessionIndex].myInput = '';
                sessions[this.state.sessionIndex].timestamp = moment().unix();
                sessions = sessions.sort((a, b) => b['timestamp'] - a['timestamp']);

                this.setState({
                    sessions: sessions,
                    sessionIndex: 0,
                });

                //发送消息
                const friend_name = friends.filter(item => item.user_id === sessions[this.state.sessionIndex].user_id);
                console.log(friend_name[0].user_name);
                socket.emit('postMsg', text, friend_name[0].user_name);
            } else if (this.state.sessionIndex >= 0) {
                sessions[this.state.sessionIndex].myInput = text;
                this.setState({
                    sessions: sessions,
                });
            } else {
                return;
            }
        })

        //获取本地聊天记录
        // const localSessions = localStorage.getItem('sessions');
        // if (localSessions)
        //     this.setState({
        //         sessions: JSON.parse(localSessions),
        //     });
    }

    //设置选中的朋友
    selectFriendAction(user_id) {
        var sessions = this.state.sessions;
        var session = this.state.sessions.filter(item => item.user_id === user_id);
        if (session.length === 0) {
            session = {
                user_id: user_id,
                messages: [],
                timestamp: moment().unix(),
            }

            sessions.push(session);
        }
        if (session.length > 0 && this.state.activeTab === 1) {
            session = session[0];
            sessions[sessions.indexOf(session)].timestamp = moment().unix();
        }

        this.setState({
            sessions: sessions,
            sessionIndex: this.state.sessions.indexOf(this.state.sessions.filter(item => item.user_id === user_id)[0]),
            scrollToBottom: true,
            activeTab: 0,
        });
    }

    //切换tab
    switchTabAction(tab_index) {
        this.setState({
            activeTab: tab_index
        });
    }

    //获取选中的朋友
    withFriend(session) {
        if (!session)
            return null;

        const user_id = session.user_id;
        const user = this.state.friends.filter(item => item.user_id === user_id);
        return user.length > 0 ? user[0] : null
    }

    //更新我的会话输入
    myInput(e) {
        var sessions = this.state.sessions;
        const text = e.target.value;
        if (this.state.sessionIndex >= 0) {
            sessions[this.state.sessionIndex].myInput = text;
        }

        this.setState({
            sessions: sessions,
        });
    }

    render() {
        //未登录则跳转回登录
        if (!this.state.isLogin)
            return <Redirect push to="/login" />;

        const session = this.state.sessions[this.state.sessionIndex] || null;
        const withFriend = this.withFriend(session);
        return (
            <div id='chat'>
                <div className="sidebar">
                    <Card user={this.state.user} activeTab={this.state.activeTab} switchTabAction={this.switchTabAction.bind(this)}></Card>
                    <List activeTab={this.state.activeTab} sessions={this.state.sessions} friends={this.state.friends} withFriend={withFriend} selectFriendAction={this.selectFriendAction.bind(this)}></List>
                </div>
                <div className="main">
                    <SessionHeader withFriend={withFriend} session={session} activeTab={this.state.activeTab} />
                    <Message activeTab={this.state.activeTab} user={this.state.user} withFriend={withFriend} session={session} scrollToBottom={this.state.scrollToBottom}></Message>
                    <Text activeTab={this.state.activeTab} session={session} myInput={this.myInput.bind(this)}></Text>
                </div>
            </div>
        );
    }
}

export default Chat;
