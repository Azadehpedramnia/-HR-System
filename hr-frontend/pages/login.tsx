import { useState } from 'react';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      // Save the JWT token to localStorage 
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } else {
      const errorData = await res.json();
      setError(errorData.message || 'Login failed');
    }
  };

  const navigateToHome = () => {
    router.push('/'); // Navigate to the index page
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control w-50" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control w-50" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Button Row */}
        <div className="d-flex gap-3">
          <button className="btn btn-primary" type="submit">
            Sign In
          </button>
          <button className="btn btn-secondary" type="button" onClick={navigateToHome}>
            Back to Home
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
