import React, { useState, useEffect } from 'react';
import { projectAPI, companyAPI } from '../services/api';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    companyId: '',
    projectName: '',
    serviceType: 'MAINTENANCE',
    contractStartDate: '',
    contractEndDate: '',
    contractManDays: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, companiesResponse] = await Promise.all([
        projectAPI.getAll(),
        companyAPI.getAll()
      ]);
      setProjects(projectsResponse.data);
      setCompanies(companiesResponse.data);
      setError(null);
    } catch (err) {
      setError('데이터 불러오기 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        companyId: parseInt(formData.companyId),
        contractManDays: parseFloat(formData.contractManDays)
      };

      if (editingProject) {
        await projectAPI.update(editingProject.id, submitData);
      } else {
        await projectAPI.create(submitData);
      }

      setFormData({
        companyId: '',
        projectName: '',
        serviceType: 'MAINTENANCE',
        contractStartDate: '',
        contractEndDate: '',
        contractManDays: ''
      });
      setShowForm(false);
      setEditingProject(null);
      fetchData();
    } catch (err) {
      setError('프로젝트 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      companyId: project.companyId.toString(),
      projectName: project.projectName,
      serviceType: project.serviceType,
      contractStartDate: project.contractStartDate,
      contractEndDate: project.contractEndDate,
      contractManDays: project.contractManDays.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 프로젝트를 삭제하시겠습니까?')) {
      try {
        await projectAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('프로젝트 삭제 실패: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({
      companyId: '',
      projectName: '',
      serviceType: 'MAINTENANCE',
      contractStartDate: '',
      contractEndDate: '',
      contractManDays: ''
    });
  };

  const getServiceTypeBadge = (type) => {
    const typeClass = type === 'MAINTENANCE' ? 'badge-info' : 'badge-warning';
    const typeLabel = type === 'MAINTENANCE' ? '유지보수' : '하자보수';
    return <span className={`badge ${typeClass}`}>{typeLabel}</span>;
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>프로젝트 관리</h2>
        {error && <div className="error">{error}</div>}

        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            새 프로젝트 등록
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>회사 *</label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                required
              >
                <option value="">회사 선택</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.companyName} ({company.companyCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>프로젝트명 *</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>서비스 유형 *</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
              >
                <option value="MAINTENANCE">유지보수</option>
                <option value="DEFECT_REPAIR">하자보수</option>
              </select>
            </div>
            <div className="form-group">
              <label>계약 시작일 *</label>
              <input
                type="date"
                name="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>계약 종료일 *</label>
              <input
                type="date"
                name="contractEndDate"
                value={formData.contractEndDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>계약 맨데이 (m/d) *</label>
              <input
                type="number"
                name="contractManDays"
                value={formData.contractManDays}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                required
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {editingProject ? '수정' : '등록'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>프로젝트명</th>
              <th>회사</th>
              <th>서비스 유형</th>
              <th>계약 기간</th>
              <th>맨데이</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td>{project.projectName}</td>
                <td>{project.companyName}</td>
                <td>{getServiceTypeBadge(project.serviceType)}</td>
                <td>
                  {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()}
                </td>
                <td>{project.contractManDays} m/d</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(project)}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(project.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectList;
