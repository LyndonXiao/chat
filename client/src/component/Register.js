import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import './Login.css';

class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            redirectToLogin: false,
            username: "",
            password: ""
        };
    }

    componentWillMount() { }
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

    register() {
        console.log(this.state);
        const username = this.state.username;
        const password = this.state.password;
        fetch('/api/register', {
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
                    if (result.code === 200) {
                        alert(result.msg);
                        this.setState({
                            redirectToLogin: true,
                        })
                    }
                    else
                        alert(result.msg);
                    console.log(result)
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    console.log(error)
                }
            )
    }
    render() {
        if (this.state.redirectToLogin)
            return <Redirect push to='/login' />

        return (
            <div>
                <h1 id="sign_title">Sign up</h1>
                <div className="login-form">
                    <div id="register_container">
                        <div className="avtar">
                            <img alt="avatar" src="./images/avtar.png" />
                        </div>
                        <form>
                            <input className="username-input" type="text" placeholder="username" value={this.state.username} onInput={(e) => this.inputUsername(e)} />
                            <input className="password-input" type="password" placeholder="password" value={this.state.password} onInput={(e) => this.inputPassword(e)} />
                        </form>
                        <div>
                            <input id="registerBtn" className="signin" type="submit" value="Register" onClick={() => this.register()} />
                        </div>
                    </div>
                </div>
                <h2>or
                <Link to="/login">
                        <span className="sub_sign_title">Sign in</span>
                    </Link>
                </h2>

                <div className="copy-rights">
                    <p>Copyright &copy; 2018.HangZhou MuYu Technology Co.,Ltd. All rights reserved.</p>
                </div>
            </div>
        );
    }
}

export default Register;