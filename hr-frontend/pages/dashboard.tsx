import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';


interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
}

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  exp: number;
}

const Dashboard = () => {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editMode, setEditMode] = useState(false);
  const handleEditClick = (emp: Employee) => {
    // EditMode 
    setEditEmployee(emp);
    setEditMode(true);
  };
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
  
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${editEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editEmployee), 
        });
      if (res.ok) {
        const updatedEmp = await res.json();
        // Update employees
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
        );
        // back to normal mode
        setEditMode(false);
        setEditEmployee(null);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error updating employee');
      }
    } catch (error) {
      setError('Error updating employee');
    }
  };
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode token to check role
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.role !== 'ADMIN') {
      setError('Access denied. Only Admin users can access this page.');
    } else {
      fetchEmployees(token);
    }
  }, []);

  const fetchEmployees = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error fetching employees');
      }
    } catch (error) {
      setError('Error fetching employees');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmployee({
      ...newEmployee,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newEmployee,
          salary: parseFloat(newEmployee.salary),
        }),
      });
      if (res.ok) {
        const employee = await res.json();
        setEmployees([...employees, employee]);
        setNewEmployee({ name: '', email: '', position: '', department: '', salary: '' });
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error adding employee');
      }
    } catch (error) {
      setError('Error adding employee');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setEmployees(employees.filter((emp) => emp.id !== id));
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error deleting employee');
      }
    } catch (error) {
      setError('Error deleting employee');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex gap-3">
        <h2>Employee Management Dashboard</h2>
        <button onClick={handleLogout} className="btn btn-secondary mb-3">
          Sign Out
        </button>
      </div>

      <h3 className="mt-5">Add New Employee</h3>
      <form onSubmit={handleAddEmployee}>
        <div className="mb-3">
          <label>Name</label>
          <input
            name="name"
            type="text"
            className="form-control w-50" 
            value={newEmployee.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input
            name="email"
            type="email"
            className="form-control w-50" 
            value={newEmployee.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Position</label>
          <input
            name="position"
            type="text"
            className="form-control w-50" 
            value={newEmployee.position}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Department</label>
          <input
            name="department"
            type="text"
            className="form-control w-50" 
            value={newEmployee.department}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Salary</label>
          <input
            name="salary"
            type="number"
            className="form-control w-50" 
            value={newEmployee.salary}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add Employee
        </button>
      </form>

      {editMode && editEmployee && (
        <div>
          <h3>Edit Employee</h3>
          <form onSubmit={handleUpdateEmployee}>
            <div className="mb-3">
              <label>Name</label>
              <input
                name="name"
                type="text"
                className="form-control w-50" 
                value={editEmployee.name}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label>Email</label>
              <input
                name="email"
                type="email"
                className="form-control w-50" 
                value={editEmployee.email}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, email: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label>Position</label>
              <input
                name="position"
                type="text"
                className="form-control w-50" 
                value={editEmployee.position}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, position: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label>Department</label>
              <input
                name="department"
                type="text"
                className="form-control w-50" 
                value={editEmployee.department}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, department: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label>Salary</label>
              <input
                name="salary"
                type="number"
                className="form-control w-50" 
                value={editEmployee.salary}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, salary: Number(e.target.value) })
                }
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Update Employee
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => {
                setEditMode(false);
                setEditEmployee(null);
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <hr />
      <h3>Employee List</h3>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.position}</td>
              <td>{emp.department}</td>
              <td>{emp.salary}</td>
              <td>
                <button className="btn btn-warning me-2"onClick={() => handleEditClick(emp)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteEmployee(emp.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
