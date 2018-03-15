import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './index.css';
import Login from './component/Login';
import Register from './component/Register';
import Chat from './component/Chat';
import registerServiceWorker from './registerServiceWorker';

//路由
ReactDOM.render(<Router>
    <div>
        <Route exact path='/' component={Login}/>
        <Route path='/login' component={Login}/>
        <Route path='/register' component={Register}/>
        <Route path='/chat' component={Chat}/>
    </div>
</Router>, document.getElementById('root'));
registerServiceWorker();
