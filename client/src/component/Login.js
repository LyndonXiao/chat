import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Cookies from 'universal-cookie';
import './Login.css';

const cookies = new Cookies();

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            redirectToChat: false,
            username: "",
            password: ""
        };
    }

    componentWillMount() {

    }
    componentDidMount() { }

    inputUsername(e) {
        this.setState({
            username: e.target.value
        })
    }

    inputPassword(e) {
        this.setState({
            password: e.target.value
        })
    }

    login() {
        const username = this.state.username;
        const password = this.state.password;
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            })
        })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log(result)
                    if (result.code === 200) {
                        cookies.set('user_token', result.data.token);
                        this.setState({
                            redirectToChat: true,
                        });
                    } else {
                        alert(result.msg);
                    }
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    alert('发生异常');
                    console.log(error)
                }
            )
    }

    render() {
        if (this.state.redirectToChat)
            return <Redirect push to="/chat" />;

        return (
            <div>
                <h1 id="sign_title">Sign in</h1>
                <div className="login-form">
                    <div id="login_container">
                        <div className="avtar">
                            <img alt="avatar" src="./images/avtar.png" />
                        </div>
                        <form>
                            <input className="username-input" type="text" placeholder="username" value={this.state.username} onInput={(e) => this.inputUsername(e)} />
                            <input className="password-input" type="password" placeholder="password" value={this.state.password} onInput={(e) => this.inputPassword(e)} />
                        </form>
                        <div>
                            <input className="signin" type="submit" value="Login" onClick={() => this.login()} />
                        </div>
                    </div>
                </div>
                <h2>or
                    <Link to="/register">
                        <span className="sub_sign_title">Sign up</span>
                    </Link>
                </h2>

                <div className="copy-rights">
                    <p>Copyright &copy; 2018.HangZhou MuYu Technology Co.,Ltd. All rights reserved.</p>
                </div>
            </div >
        );
    }
}

export default Login;