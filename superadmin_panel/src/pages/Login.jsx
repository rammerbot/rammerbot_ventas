import React, { useState } from 'react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('http://localhost:8000/api/v1/superadmin/login', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Credenciales inválidas');
            
            const data = await response.json();
            localStorage.setItem('superadmin_token', data.access_token);
            onLogin();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 style={{textAlign: 'center', marginBottom: '10px'}}>SuperAdmin</h1>
                <p style={{textAlign: 'center', color: '#7e8299', marginBottom: '30px'}}>Gestión de Empresas RammerBot</p>
                
                {error && <div style={{background: 'rgba(246,78,96,0.1)', color: '#f64e60', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center'}}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Usuario Maestro</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            className="admin-input" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn btn-primary" style={{width: '100%', marginTop: '10px'}} disabled={loading}>
                        {loading ? 'Accediendo...' : 'ENTRAR AL PANEL'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
