const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT secret from .env
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to verify JWT token and attach user data to request
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // The token is expected in the format "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user object: { id, email, role }
    next();
  });
}
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Middleware to check if user is an Admin
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
}

// ---------------------
// Authentication Routes
// ---------------------

// POST /api/auth/login – Authenticate user and return JWT token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];

    // Compare the provided password with the hashed password in DB
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create and return a JWT token (expires in 1 hour)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------
// Employee Management Routes (Admin Only)
// ---------------------

// GET /api/employees – List all employees
app.get('/api/employees', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/employees – Add a new employee
app.post('/api/employees', authenticateToken, isAdmin, async (req, res) => {
  const { name, email, position, department, salary } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO employees (name, email, position, department, salary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, position, department, salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/employees/:id – Edit employee details
app.put('/api/employees/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, email, position, department, salary } = req.body;
  try {
    const result = await pool.query(
      'UPDATE employees SET name = $1, email = $2, position = $3, department = $4, salary = $5 WHERE id = $6 RETURNING *',
      [name, email, position, department, salary, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/employees/:id – Delete an employee
app.delete('/api/employees/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
