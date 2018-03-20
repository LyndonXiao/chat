import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import moment from 'moment';
import { Scrollbars } from 'react-custom-scrollbars';
import './Chat.css';

class Card extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const user = this.props.user;
        return (
            <div className="m-card">
                <header>
                    <img className="avatar" width="40" height="40" src={user.user_avatar} />
                    <p className="name">{user.user_name}</p>
                </header>
                <footer>
                    <input className="search" type="text" placeholder="search user..." />
                </footer>
            </div>
        );
    }
}

class List extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const withFriend = this.props.withFriend ? this.props.withFriend.user_id : null;
        const friends = this.props.friends;
        return (
            <div className="m-list">
                <ul>
                    {friends.map((value, index) =>
                        <li key={index} id={value.user_id} className={withFriend === value.user_id ? 'active' : ''} onClick={() => this.props.selectFriend(value)}>
                            <img className="avatar" width="30" height="30" src={value.user_avatar} />
                            <p className="name">{value.user_name}</p>
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}

class Message extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { scrollbars } = this.refs;
            scrollbars.scrollToBottom();
    }
    
    componentDidUpdate() {
        const { scrollbars } = this.refs;
        if(this.props.scrollToBottom)
            scrollbars.scrollToBottom();
    }

    session() {
        return this.state.sessions[this.state.sessionIndex];
    }

    render() {
        const session = this.props.session;
        const me = this.props.user;
        const friend = this.props.withFriend;
        const messages = session ? session.messages : [];
        return (
            <Scrollbars ref="scrollbars" style={{ width: '100%', height: 'calc(100% - 10pc)' }}
                autoHide
                autoHideTimeout={1000}
                autoHideDuration={200}>
                <div className="m-message">
                    <ul>
                        {messages.map((value, index) =>
                            <li key={index}>
                                <p className="time"><span>{value.date}</span></p>
                                <div className={value.self ? 'main self' : 'main'}>
                                    <img className="avatar" width="30" height="30" src={value.self ? me.user_avatar : friend.user_avatar} />
                                    <div className="text">{value.text}</div>
                                </div>
                            </li>)}

                    </ul>
                </div>
            </Scrollbars>
        );
    }
}

class Text extends Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    render() {
        return (
            <div className="m-text">
                <textarea id='myInput' placeholder="按 Enter 发送" value={this.props.session.myInput || ''} onInput={e => this.props.myInput(e)}></textarea>
            </div>
        );
    }
}

class Chat extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // 登录用户
            user: {
                user_id: 1,
                user_name: 'Coffce',
                user_avatar: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=672067228&username=@f7b7de17a4892fd3536827d974c0f3bb&skey=@crypt_b49389e7_e0c7c827a1a63b7b36695413c3b82d8d'
            },

            // 朋友列表
            friends: [
                {
                    user_id: 2,
                    user_name: '站长素材',
                    user_avatar: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=672084244&username=@2b29b76adfba683c16d8e142cef9b666de530eaff918f9bea5fbf6da5af809fc&skey=@crypt_b49389e7_e0c7c827a1a63b7b36695413c3b82d8d'
                },
                {
                    user_id: 3,
                    user_name: 'webpack',
                    user_avatar: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=672074502&username=@38c0273ca7c16b65a5bf82d67c1d20f0d4bfefd5bc099f1bb88affeff176779d&skey=@crypt_b49389e7_e0c7c827a1a63b7b36695413c3b82d8d'
                }
            ],

            // 会话列表(和朋友列表user_id同步)
            sessions: [
                {
                    user_id: 2,
                    messages: [
                        {
                            text: 'Hello，这是一个基于Vue + Webpack构建的简单chat示例，聊天记录保存在localStorge。简单演示了Vue的基础特性和webpack配置。',
                            date: '2018-03-9 12:34:45',
                            self: true
                        },
                        {
                            text: '项目地址: https://sc.chinaz.com/jiaoben/',
                            date: '2018-03-9 12:34:45'
                        },
                        {
                            text: 'Hello，这是一个基于Vue + Webpack构建的简单chat示例，聊天记录保存在localStorge。简单演示了Vue的基础特性和webpack配置。',
                            date: '2018-03-9 12:34:45'
                        },
                        {
                            text: '项目地址: https://sc.chinaz.com/jiaoben/',
                            date: '2018-03-9 12:34:45',
                            self: true
                        },
                        {
                            text: 'Hello，这是一个基于Vue + Webpack构建的简单chat示例，聊天记录保存在localStorge。简单演示了Vue的基础特性和webpack配置。',
                            date: '2018-03-9 12:34:45'
                        },
                        {
                            text: '项目地址: https://sc.chinaz.com/jiaoben/',
                            date: '2018-03-9 12:34:45'
                        },
                        {
                            text: 'Hello，这是一个基于Vue + Webpack构建的简单chat示例，聊天记录保存在localStorge。简单演示了Vue的基础特性和webpack配置。',
                            date: '2018-03-9 12:34:45'
                        },
                        {
                            text: '项目地址: https://sc.chinaz.com/jiaoben/',
                            date: '2018-03-9 12:34:45',
                            self: true
                        }
                    ]
                },
                {
                    user_id: 3,
                    messages: []
                }
            ],
            sessionIndex: 0,
            scrollToBottom: true,
        };
    }

    componentDidMount() {
        document.getElementById('myInput').addEventListener('keyup', e => {
            var sessions = this.state.sessions;
            const keycode = e.keyCode;
            const text = e.target.value;
            if (keycode === 13 && text && this.state.sessionIndex >= 0) {
                sessions[this.state.sessionIndex].messages.push({
                    text: text,
                    date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    self: true
                });
                sessions[this.state.sessionIndex].myInput = '';
            } else if (this.state.sessionIndex >= 0) {
                sessions[this.state.sessionIndex].myInput = text;
            } else {
                return;
            }

            this.setState({
                sessions: sessions,
            });
        })
    }

    //设置选中的朋友
    selectFriend(item) {
        this.setState({
            sessionIndex: this.state.friends.indexOf(item),
            scrollToBottom: true,
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

    //进行中会话
    session() {
        return this.state.sessions[this.state.sessionIndex] || null;
    }

    render() {
        const session = this.state.sessions[this.state.sessionIndex] || null;
        const withFriend = this.withFriend(session);
        return (
            <div id='chat'>
                <div className="sidebar">
                    <Card user={this.state.user}></Card>
                    <List friends={this.state.friends} withFriend={withFriend} selectFriend={this.selectFriend.bind(this)}></List>
                </div>
                <div className="main">
                    <Message user={this.state.user} withFriend={withFriend} session={session} scrollToBottom={this.state.scrollToBottom}></Message>
                    <Text session={session} myInput={this.myInput.bind(this)}></Text>
                </div>
            </div>
        );
    }
}

export default Chat;
