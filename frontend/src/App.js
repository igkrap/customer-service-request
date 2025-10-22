import React, { useState } from 'react';
import CustomerList from './components/CustomerList';
import ServiceRequestList from './components/ServiceRequestList';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="App">
      <header className="header">
        <h1>Customer Service Request Management System</h1>
        <nav className="nav">
          <button
            className={activeTab === 'customers' ? 'active' : ''}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Service Requests
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'customers' && <CustomerList />}
        {activeTab === 'requests' && <ServiceRequestList />}
      </main>
    </div>
  );
}

export default App;
