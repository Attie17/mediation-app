import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form className="max-w-md mx-auto bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 px-3 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">Sign In</button>
      </form>
    </div>
  );
};

export default SignInPage;
