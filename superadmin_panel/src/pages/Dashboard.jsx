import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, ShieldCheck, LogOut, Edit2, Trash2, UserPlus, X, Save } from 'lucide-react';

const Dashboard = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchUsers, setBranchUsers] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editUserMode, setEditUserMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [newBranch, setNewBranch] = useState({
        name: '', subdomain: '', rif: '', address: '', phone: '', fiscal_message: '', fiscal_serial: ''
    });

    const [newUser, setNewUser] = useState({
        username: '', password: '', role: 'ADMINISTRADOR'
    });

    const token = localStorage.getItem('superadmin_token');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/superadmin/branches', { headers });
            if (!res.ok) throw new Error('Sesión expirada o sin permisos');
            const data = await res.json();
            setBranches(data);
        } catch (err) {
            alert(err.message);
            localStorage.removeItem('superadmin_token');
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreateOrUpdateBranch = async (e) => {
        e.preventDefault();
        const url = editMode 
            ? `http://localhost:8000/api/v1/superadmin/branches/${selectedBranch.id}`
            : 'http://localhost:8000/api/v1/superadmin/branches';
        
        try {
            const res = await fetch(url, {
                method: editMode ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(newBranch)
            });
            if (res.ok) {
                setShowModal(false);
                setEditMode(false);
                setNewBranch({ name: '', subdomain: '', rif: '', address: '', phone: '', fiscal_message: '' });
                fetchBranches();
            }
        } catch (err) {
            alert("Error al procesar sucursal");
        }
    };

    const handleDeleteBranch = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta sucursal? Se borrará todo lo asociado.")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/v1/superadmin/branches/${id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) fetchBranches();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    const openManageUsers = async (branch) => {
        setSelectedBranch(branch);
        setShowUserModal(true);
        setEditUserMode(false);
        setNewUser({ username: '', password: '', role: 'ADMINISTRADOR' });
        try {
            const res = await fetch(`http://localhost:8000/api/v1/superadmin/branches/${branch.id}/users`, { headers });
            const data = await res.json();
            setBranchUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateOrUpdateUser = async (e) => {
        e.preventDefault();
        const url = editUserMode 
            ? `http://localhost:8000/api/v1/superadmin/users/${selectedUser.id}`
            : `http://localhost:8000/api/v1/superadmin/users?branch_id=${selectedBranch.id}`;
        
        try {
            const res = await fetch(url, {
                method: editUserMode ? 'PUT' : 'POST',
                headers,
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setNewUser({ username: '', password: '', role: 'ADMINISTRADOR' });
                setEditUserMode(false);
                openManageUsers(selectedBranch);
            } else {
                const data = await res.json();
                alert(data.detail || "Error al procesar usuario");
            }
        } catch (err) {
            alert("Error de conexión");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Eliminar este usuario?")) return;
        try {
            const res = await fetch(`http://localhost:8000/api/v1/superadmin/users/${userId}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) openManageUsers(selectedBranch);
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    const logout = () => {
        localStorage.removeItem('superadmin_token');
        window.location.reload();
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px'}}>
                    <ShieldCheck color="#3699ff" size={32} />
                    <h2 style={{margin: 0, fontSize: '1.2rem'}}>RammerMaster</h2>
                </div>
                <nav style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(54,153,255,0.1)', color: '#3699ff', borderRadius: '8px', cursor: 'pointer'}}>
                        <Building2 size={20} />
                        <strong>Empresas</strong>
                    </div>
                </nav>
                <button onClick={logout} className="btn" style={{background: 'rgba(246,78,96,0.1)', color: '#f64e60', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
                    <LogOut size={18} /> SALIR
                </button>
            </aside>

            <main className="admin-main">
                <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                    <div>
                        <h1 style={{margin: 0}}>Gestión de Empresas</h1>
                        <p style={{color: '#7e8299', margin: '5px 0 0 0'}}>Panel de control global del sistema</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditMode(false); setNewBranch({ name: '', subdomain: '', rif: '', address: '', phone: '', fiscal_message: '' }); setShowModal(true); }} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Plus size={20} /> NUEVA EMPRESA
                    </button>
                </header>

                <div className="card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nombre / Empresa</th>
                                <th>RIF / Contribuyente</th>
                                <th>Subdominio</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div style={{fontWeight: 700}}>{b.name}</div>
                                        <div style={{fontSize: '0.8rem', color: '#7e8299'}}>{b.address}</div>
                                    </td>
                                    <td>
                                        <div>{b.rif}</div>
                                        {b.fiscal_message && <span className="status-badge" style={{background: 'rgba(54,153,255,0.1)', color: '#3699ff'}}>{b.fiscal_message}</span>}
                                    </td>
                                    <td><code style={{color: '#3699ff'}}>{b.subdomain}</code></td>
                                    <td><span className="status-badge status-active">ACTIVA</span></td>
                                    <td>
                                        <div style={{display: 'flex', gap: '10px'}}>
                                            <button className="btn" style={{background: '#242631', color: '#3699ff'}} onClick={() => openManageUsers(b)} title="Gestionar Usuarios"><Users size={16} /></button>
                                            <button className="btn" style={{background: '#242631', color: '#1bc5bd'}} onClick={() => { setSelectedBranch(b); setNewBranch(b); setEditMode(true); setShowModal(true); }} title="Editar"><Edit2 size={16} /></button>
                                            <button className="btn" style={{background: '#242631', color: '#f64e60'}} onClick={() => handleDeleteBranch(b.id)} title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL EMPRESA */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{width: '500px'}}>
                            <h2>{editMode ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h2>
                            <form onSubmit={handleCreateOrUpdateBranch}>
                                <div className="input-group">
                                    <label>Razón Social</label>
                                    <input className="admin-input" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} required />
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                    <div className="input-group">
                                        <label>Subdominio (URL)</label>
                                        <input className="admin-input" value={newBranch.subdomain} onChange={e => setNewBranch({...newBranch, subdomain: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>RIF</label>
                                        <input className="admin-input" value={newBranch.rif} onChange={e => setNewBranch({...newBranch, rif: e.target.value})} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Dirección Fiscal</label>
                                    <input className="admin-input" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} />
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                    <div className="input-group">
                                        <label>Teléfono</label>
                                        <input className="admin-input" value={newBranch.phone} onChange={e => setNewBranch({...newBranch, phone: e.target.value})} />
                                    </div>
                                    <div className="input-group">
                                        <label>Serial Impresora Fiscal</label>
                                        <input className="admin-input" placeholder="Ej: ZZZ1234567" value={newBranch.fiscal_serial} onChange={e => setNewBranch({...newBranch, fiscal_serial: e.target.value})} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label style={{display: 'flex', alignItems: 'center', gap: '10px', height: '100%', marginTop: '10px', cursor: 'pointer'}}>
                                        <input type="checkbox" checked={newBranch.fiscal_message === 'CONTRIBUYENTE ESPECIAL'} 
                                            onChange={e => setNewBranch({...newBranch, fiscal_message: e.target.checked ? 'CONTRIBUYENTE ESPECIAL' : ''})} 
                                        />
                                        Contribuyente Especial
                                    </label>
                                </div>
                                <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                                    <button type="button" className="btn" style={{flex: 1, background: '#242631', color: 'white'}} onClick={() => setShowModal(false)}>CANCELAR</button>
                                    <button type="submit" className="btn btn-primary" style={{flex: 1}}>{editMode ? 'GUARDAR CAMBIOS' : 'CREAR EMPRESA'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL USUARIOS */}
                {showUserModal && (
                    <div className="modal-overlay">
                        <div className="card modal-content" style={{width: '800px'}}>
                            <header style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                                <h2>Usuarios: {selectedBranch?.name}</h2>
                                <button onClick={() => setShowUserModal(false)} className="btn" style={{background: 'none', color: '#7e8299'}}><X /></button>
                            </header>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px'}}>
                                <div className="user-form" style={{borderRight: '1px solid #2b2c3a', paddingRight: '20px'}}>
                                    <h3 style={{fontSize: '1rem', marginBottom: '15px'}}>{editUserMode ? 'Editar Usuario' : 'Añadir Usuario'}</h3>
                                    <form onSubmit={handleCreateOrUpdateUser}>
                                        <div className="input-group">
                                            <label>Usuario</label>
                                            <input className="admin-input" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                                        </div>
                                        <div className="input-group">
                                            <label>{editUserMode ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</label>
                                            <input type="password" className="admin-input" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required={!editUserMode} />
                                        </div>
                                        <div className="input-group">
                                            <label>Rol</label>
                                            <select className="admin-input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                                <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                                <option value="VENDEDOR">VENDEDOR</option>
                                                <option value="SUPERVISOR">SUPERVISOR</option>
                                                <option value="AUDITOR">AUDITOR</option>
                                            </select>
                                        </div>
                                        <div style={{display: 'flex', gap: '10px'}}>
                                            {editUserMode && <button type="button" className="btn" style={{flex: 1, background: '#242631', color: 'white'}} onClick={() => { setEditUserMode(false); setNewUser({username: '', password: '', role: 'ADMINISTRADOR'}); }}>ANULAR</button>}
                                            <button className="btn btn-primary" style={{flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                                {editUserMode ? <><Save size={16}/> GUARDAR</> : <><Plus size={16}/> AÑADIR</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="user-list">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Usuario</th>
                                                <th>Rol</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branchUsers.map(u => (
                                                <tr key={u.id}>
                                                    <td>{u.username}</td>
                                                    <td><span className="status-badge" style={{background: '#242631'}}>{u.role}</span></td>
                                                    <td>
                                                        <div style={{display: 'flex', gap: '5px'}}>
                                                            <button className="btn" style={{color: '#1bc5bd', padding: '5px'}} onClick={() => { setSelectedUser(u); setNewUser({username: u.username, password: '', role: u.role}); setEditUserMode(true); }}><Edit2 size={14}/></button>
                                                            <button className="btn" style={{color: '#f64e60', padding: '5px'}} onClick={() => handleDeleteUser(u.id)}><Trash2 size={14}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    background: rgba(0,0,0,0.85); display: flex; align-items: center; 
                    justify-content: center; z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .modal-content { border: 1px solid #3699ff; box-shadow: 0 0 30px rgba(54,153,255,0.2); }
                input[type="checkbox"] { transform: scale(1.3); accent-color: #3699ff; }
                select.admin-input { appearance: none; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default Dashboard;
