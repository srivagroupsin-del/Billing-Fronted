import React, { useState } from "react";
import "./Manage.css";

type Permissions = {
  read: boolean;
  write: boolean;
  admin: boolean;
  billing: boolean;
  reports: boolean;
  settings: boolean;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  isActive: boolean;
  permissions: Permissions;
};

const sampleEmployees: Employee[] = [
  {
    id: 101,
    name: "Hari",
    email: "hari@gmail.com",
    phone: "+91 9876543210",
    role: "Manager",
    department: "Billing",
    isActive: true,
    permissions: { read: true, write: true, admin: false, billing: true, reports: true, settings: false },
  },
  {
    id: 102,
    name: "Ravi",
    email: "ravi@gmail.com",
    phone: "+91 8888888888",
    role: "Staff",
    department: "Support",
    isActive: false,
    permissions: { read: true, write: false, admin: false, billing: false, reports: true, settings: false },
  },
];

const Manage: React.FC = () => {
  const [empId, setEmpId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search Employee
  const handleSearch = () => {
    if (!empId) return;
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const found = employees.find((emp) => emp.id === Number(empId));
      setSelectedEmp(found || null);
      setIsLoading(false);
    }, 400);
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Toggle Access Status
  const toggleStatus = () => {
    if (!selectedEmp) return;
    setSelectedEmp({
      ...selectedEmp,
      isActive: !selectedEmp.isActive,
    });
  };

  // Toggle Permissions
  const handlePermissionToggle = (key: keyof Permissions) => {
    if (!selectedEmp) return;
    setSelectedEmp({
      ...selectedEmp,
      permissions: {
        ...selectedEmp.permissions,
        [key]: !selectedEmp.permissions[key],
      },
    });
  };

  const handleSave = () => {
    if (!selectedEmp) return;
    // Update main employee list
    setEmployees(emps => emps.map(e => e.id === selectedEmp.id ? selectedEmp : e));
    alert("Employee permissions updated successfully.");
  };

  return (
    <div className="manage-page-wrapper">
      <div className="manage-header-section">
        <h2 className="manage-title">Employee Access Control</h2>
        
        <div className="manage-search-bar">
          <input
            type="number"
            placeholder="Enter Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <div className="manage-content-layout">
        <div className="left-column">
          {selectedEmp ? (
            <div className="employee-info-card">
              <div className="emp-card-header">
                <div className="emp-avatar">
                  {selectedEmp.name.charAt(0)}
                </div>
                <div className="emp-title-info">
                  <h3>{selectedEmp.name}</h3>
                  {selectedEmp.phone && <p>{selectedEmp.phone}</p>}
                  <p>{selectedEmp.email}</p>
                </div>
              </div>
              
              <div className="emp-card-body">
                <div className="detail-row">
                  <span className="detail-label">Employee ID</span>
                  <span className="detail-value">{selectedEmp.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{selectedEmp.department}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role</span>
                  <span className="detail-value">{selectedEmp.role}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value">
                    <button
                      className={`status-toggle-btn ${selectedEmp.isActive ? "active" : "inactive"}`}
                      onClick={toggleStatus}
                    >
                      {selectedEmp.isActive ? "Active" : "Inactive"}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-employee-card">
              <p>No employee selected</p>
              <span>Search for an employee ID to manage their access</span>
            </div>
          )}
        </div>

        <div className="right-column">
          <div className="access-control-panel">
            <div className="panel-header">
              <h3>Access Control</h3>
              <p>Manage system permissions and module access</p>
            </div>
            
            <div className={`panel-body ${!selectedEmp ? 'disabled-panel' : ''}`}>
              <div className="permission-group">
                <h4>System Access</h4>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">Read Access</span>
                    <span className="perm-desc">Can view records and reports</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.read || false} 
                      onChange={() => handlePermissionToggle('read')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">Write Access</span>
                    <span className="perm-desc">Can create and edit records</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.write || false} 
                      onChange={() => handlePermissionToggle('write')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">Admin Access</span>
                    <span className="perm-desc">Full system configuration control</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.admin || false} 
                      onChange={() => handlePermissionToggle('admin')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="permission-group">
                <h4>Module Access</h4>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">Billing Module</span>
                    <span className="perm-desc">Create and manage invoices</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.billing || false} 
                      onChange={() => handlePermissionToggle('billing')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">Reports Dashboard</span>
                    <span className="perm-desc">Access financial and sales analytics</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.reports || false} 
                      onChange={() => handlePermissionToggle('reports')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="perm-info">
                    <span className="perm-label">System Settings</span>
                    <span className="perm-desc">Manage business configurations</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedEmp?.permissions.settings || false} 
                      onChange={() => handlePermissionToggle('settings')}
                      disabled={!selectedEmp}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button 
                className="save-changes-btn" 
                onClick={handleSave}
                disabled={!selectedEmp}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;