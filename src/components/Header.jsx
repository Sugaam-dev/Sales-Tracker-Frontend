import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuickCreateLeadModal from './QuickCreateLeadModal';
import { createLead } from '../services/leadService';
import './Header.css';

const SEARCH_DATA = [
  { id: 15, company: 'Horizon Retail', contact: 'David Smith', type: 'Lead' },
  { id: 16, company: 'Zenith Financial', contact: 'Alice Cooper', type: 'Lead' },
  { id: 22, company: 'NovaMed Healthcare', contact: 'Jennifer Wu', type: 'Lead' },
  { id: 28, company: 'Quantum Tech', contact: 'Alex Rodriguez', type: 'Lead' },
  { id: 5, company: 'EcoLogistics', contact: 'David Smith', type: 'Lead' },
  { id: 12, company: 'GlobalTech Solutions', contact: 'Sarah Jenkins', type: 'Lead' },
  { id: 8, company: 'Pinnacle Consulting', contact: 'Jane Smith', type: 'Lead' },
  { id: 23, company: 'Acme Corp', contact: 'Sarah Jenkins', type: 'Lead' },
  { id: 19, company: 'Wayne Enterprises', contact: 'David Miller', type: 'Lead' },
  { id: 30, company: 'Stark Industries', contact: 'Pepper Potts', type: 'Lead' }
];

const NOTIFICATIONS = [
  { id: 1, text: 'New lead assigned: Horizon Retail', time: '5m ago' },
  { id: 2, text: 'Meeting reminder: Sarah Jenkins (10:00 AM)', time: '20m ago' },
  { id: 3, text: 'Proposal viewed by Zenith Financial', time: '1h ago' },
  { id: 4, text: 'Email bounce alert: David@Globex.com', time: '2h ago' },
  { id: 5, text: 'Deal closed: Initech has upgraded to Enterprise', time: '4h ago' },
  { id: 6, text: 'New comment from Debabrata Ghosh on EcoLogistics', time: '1d ago' },
  { id: 7, text: 'Task overdue: Call NovaMed Healthcare', time: '2d ago' },
  { id: 8, text: 'Demo recording uploaded for Quantum Tech', time: '3d ago' },
  { id: 9, text: 'Import completion: 150 contacts added', time: '4d ago' },
  { id: 10, text: 'Monthly sales report is now available', time: '5d ago' },
  { id: 11, text: 'System maintenance scheduled for Sunday', time: '1w ago' }
];

export default function Header() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setShowBanner(true), 1500);
    const hideTimer = setTimeout(() => setShowBanner(false), 12500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const filteredSearch = searchQuery.trim()
    ? SEARCH_DATA.filter(
        item =>
          item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.contact.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCreateLead = async (data) => {
    setIsModalOpen(false);
    try {
      const cleanPhone = String(data.phone).replace(/[^0-9]/g, '').slice(0, 10);
      let statusPayload = 'Open';
      const lowercaseStatus = String(data.status).toLowerCase();
      if (['open', 'new', 'contacted', 'interested', 'negotiation'].includes(lowercaseStatus)) {
        statusPayload = 'Open';
      } else if (lowercaseStatus === 'in progress' || lowercaseStatus === 'analysis') {
        statusPayload = 'In Progress';
      } else if (lowercaseStatus === 'won' || lowercaseStatus === 'closed won') {
        statusPayload = 'Won';
      } else if (lowercaseStatus === 'lost' || lowercaseStatus === 'closed lost') {
        statusPayload = 'Lost';
      }

      const payload = {
        company: data.companyName,
        contact: data.leadName,
        email: data.email,
        phone: cleanPhone,
        officePhone: cleanPhone,
        owner: data.owner,
        stage: 'Qualification',
        status: statusPayload,
        sentiment: 'Neutral',
        priority: data.priority === 'Medium' ? 'Normal' : data.priority,
        kamName: data.leadName,
        productService: data.productService || '',
        requestType: data.requestType || '',
        estimatedRequirementDate: data.estDate || '',
      };
      await createLead(payload);
      setToastMessage('Lead created - Added to pipeline');
      
      setTimeout(() => {
        setToastMessage('');
        // Reload page to show the new lead in the list
        if (window.location.pathname === '/leads') {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      console.error('Quick Create Error:', err);
      // Extract exact validation error from backend response if available
      const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Failed to quick create lead: ${errorDetail}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectResult = (lead) => {
    setSearchQuery('');
    navigate('/leads', {
      state: {
        selectedLeadId: lead.id,
      },
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (filteredSearch.length === 1) {
      handleSelectResult(filteredSearch[0]);
    }
  };

  const toggleNotifications = () => {
    setIsNotifOpen(prev => !prev);
  };

  const closeBanner = (e) => {
    e.stopPropagation();
    setShowBanner(false);
  };

  const openNotifications = () => {
    setShowBanner(false);
    setIsNotifOpen(true);
  };

  return (
    <>
  <header className="main-header">
    <div className="search-container">
      <form className="search-form" onSubmit={handleSearch}>
        <button type="submit" className="search-button">
          <Search size={20} />
        </button>

        <input
          type="text"
          className="search-input"
          placeholder="Search leads by company, contact or email..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </form>

      {searchQuery.trim().length > 0 && (
        <div className="search-dropdown">
          {filteredSearch.length ? (
            <>
              <div className="search-dropdown-title">
                Leads
              </div>

              {filteredSearch.map((lead) => (
                <div
                  key={lead.id}
                  className="search-result"
                  onClick={() => handleSelectResult(lead)}
                >
                  <p className="search-company">
                    {lead.company}
                  </p>

                  <p className="search-contact">
                    Contact: {lead.contact}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <div className="search-empty">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>

    <div className="header-actions">
      <div className="notification-wrapper">

        <button
          className="notif-btn"
          onClick={toggleNotifications}
        >
          <Bell
            size={42}
            strokeWidth={2.8}
          />

          <span className="notif-badge">
            {NOTIFICATIONS.length}
          </span>
        </button>

        {showBanner && (
          <div
            className="new-notif-banner"
            onClick={openNotifications}
          >
            <div className="banner-header">

              <span className="banner-title">
                New Alert
              </span>

              <button
                className="banner-close"
                onClick={closeBanner}
              >
                <X size={14} />
              </button>

            </div>

            <span className="banner-text">
              {NOTIFICATIONS[0].text}
            </span>

            <span className="banner-time">
              Just now
            </span>

          </div>
        )} 
                {isNotifOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <h4>Notifications</h4>
            </div>

            <div className="notif-list">
              {NOTIFICATIONS.map((notification) => (
                <div
                  key={notification.id}
                  className="notif-item"
                >
                  <p className="notif-text">
                    {notification.text}
                  </p>

                  <span className="notif-time">
                    {notification.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus size={20} />
        Quick Create Lead
      </button>
    </div>
  </header>

  <QuickCreateLeadModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onCreate={handleCreateLead}
  />

  {toastMessage && (
    <div className="toast">
      {toastMessage}
    </div>
  )}
</>
  );
}