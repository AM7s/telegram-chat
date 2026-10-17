import { useState } from "react";


export function LoginForm({ onLogin }) {
    const [idInstance, setIdInstance] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [error, setError] = useState('');


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!idInstance.trim() || !apiToken.trim()){
            setError('Заполните все поля');
            return;
        }
        onLogin({ idInstance: idInstance.trim(), apiTokenInstance: apiToken.trim() });
    };


    return(
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Telegram Chat</h2>
                <p className="hint">Вход через аккаунт GREEN-API</p>

                <input 
                type="text" 
                placeholder="IdInstance" 
                value={idInstance} 
                onChange={e => setIdInstance(e.target.value)} 
                />
                <input 
                type="password" 
                placeholder="ApiTokenInstance" 
                value={apiToken} 
                onChange={e => setApiToken(e.target.value)}
                />

                {error && <p className="error">{error}</p>}

                <button type="submit">Войти в чат</button>
            </form>
        </div>
    );
}