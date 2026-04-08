import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield, User, Mail, Lock, IdCard } from 'lucide-react';
import { registerUser } from '../../api/auth';
import './RegisterPage.css';

const RegisterPage = () => {
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await registerUser({
                user_id: userId,
                name: name,
                email: email,
                password: password
            });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (error: any) {
            alert('Registration failed: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-overlay"></div>
            <div className="register-card glass">
                <div className="register-header">
                    <div className="logo-icon">
                        <Shield size={32} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join BillFlow Admin portal</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>User ID</label>
                        <div className="input-wrapper">
                            <IdCard size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="U12345"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="john.doe@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="register-btn" disabled={isLoading}>
                        {isLoading ? (
                            <div className="loader"></div>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    <p className="copyright">© 2026 BillFlow Systems. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
