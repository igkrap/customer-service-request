import React, { useState, useEffect } from 'react';
import { userAPI, companyAPI } from '../services/api';
import { formatDateTime } from '../utils/dateFormatter';

function PendingUserList() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, companiesResponse] = await Promise.all([
        userAPI.getPending(),
        companyAPI.getAll()
      ]);
      setPendingUsers(pendingResponse.data);
      setCompanies(companiesResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (userId, companyId) => {
    setSelectedCompanies({
      ...selectedCompanies,
      [userId]: companyId
    });
  };

  const handleApprove = async (userId) => {
    const companyId = selectedCompanies[userId];

    if (!companyId) {
      setError('Please select a company for this user');
      return;
    }

    try {
      await userAPI.approve(userId, parseInt(companyId), 'APPROVED');
      fetchData(); // Refresh the list
      setError(null);

      // Remove the selected company from state
      const newSelected = { ...selectedCompanies };
      delete newSelected[userId];
      setSelectedCompanies(newSelected);
    } catch (err) {
      setError('Failed to approve user: ' + (err.response?.data || err.message));
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        await userAPI.reject(userId);
        fetchData(); // Refresh the list
        setError(null);
      } catch (err) {
        setError('Failed to reject user: ' + (err.response?.data || err.message));
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>Pending User Approvals</h2>
        {error && <div className="error">{error}</div>}

        {pendingUsers.length === 0 ? (
          <p>No pending user approvals.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Assign Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge badge-customer">
                      {user.role === 'ROLE_CUSTOMER' ? 'Customer' : user.role}
                    </span>
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <select
                      value={selectedCompanies[user.id] || ''}
                      onChange={(e) => handleCompanyChange(user.id, e.target.value)}
                      required
                    >
                      <option value="">Select a company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.companyName} ({company.companyCode})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(user.id)}
                      disabled={!selectedCompanies[user.id]}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(user.id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PendingUserList;
