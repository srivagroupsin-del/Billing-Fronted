import { useState, useRef, useEffect, useMemo } from "react";
import { Bell, ChevronRight, Briefcase, Package, Receipt, Settings, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./notification.css";

interface NotificationCategory {
  id: number;
  title: string;
  count: number;
  icon: any;
  iconBg: string;
  badgeBg: string;
  description?: string;
}

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLowTime, setIsLowTime] = useState(false);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    { 
      id: 1, 
      title: "Business Setup", 
      count: 2, 
      icon: <Briefcase size={18} color="#ef4444" />, 
      iconBg: "#fef2f2",
      badgeBg: "#ef4444" 
    },
    { 
      id: 2, 
      title: "Product", 
      count: 7, 
      icon: <Package size={18} color="#ef4444" />, 
      iconBg: "#fff1f2",
      badgeBg: "#ef4444" 
    },
    { 
      id: 3, 
      title: "Billing", 
      count: 3, 
      icon: <Receipt size={18} color="#3b82f6" />, 
      iconBg: "#eff6ff",
      badgeBg: "#3b82f6" 
    },
    { 
      id: 4, 
      title: "Management", 
      count: 1, 
      icon: <Settings size={18} color="#64748b" />, 
      iconBg: "#f1f5f9",
      badgeBg: "#64748b" 
    },
  ]);

  // Calculate session expiry
  useEffect(() => {
    const updateCountdown = () => {
      const loginTimestamp = localStorage.getItem('login_timestamp');
      if (!loginTimestamp) {
        setTimeRemaining("Not Set");
        setIsLowTime(false);
        return;
      }

      const now = Date.now();
      const expiryTime = 24 * 60 * 60 * 1000;
      const timeLeft = expiryTime - (now - parseInt(loginTimestamp));

      if (timeLeft <= 0) {
        setTimeRemaining("Expired");
        setIsLowTime(true);
      } else if (timeLeft <= 5 * 60 * 1000) {
        // Last 5 minutes: Show mm:ss and set urgent mode
        setIsLowTime(true);
        const mins = Math.floor(timeLeft / (1000 * 60));
        const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeRemaining(`${mins}:${secs < 10 ? '0' : ''}${secs} left`);
      } else {
        setIsLowTime(false);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m left`);
      }
    };

    updateCountdown();
    // Use 1s interval if low time, else 60s
    const intervalTime = isLowTime ? 1000 : 60000;
    const interval = setInterval(updateCountdown, intervalTime);
    return () => clearInterval(interval);
  }, [isLowTime]);

  const allCategories = useMemo(() => {
    if (!isLowTime) return categories;

    const sessionCat: NotificationCategory = {
      id: 5,
      title: "Session Expiry",
      count: 0,
      icon: <Clock size={18} color="#ef4444" />,
      iconBg: "#fef2f2",
      badgeBg: "#ef4444",
      description: "Urgent: Renew session now"
    };
    return [...categories, sessionCat];
  }, [categories, timeRemaining, isLowTime]);

  const totalCount = categories.reduce((sum, item) => sum + item.count, 0) + (isLowTime ? 1 : 0);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCategories(categories.map(cat => ({ ...cat, count: 0 })));
  };

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    navigate("/notifications");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <div className="icon-wrapper" onClick={toggleDropdown}>
        <Bell className="bell-icon" />
        {totalCount > 0 && <span className="count-badge">{totalCount}</span>}
      </div>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            <button className="mark-read-btn" onClick={handleMarkAllRead}>
              Mark All as Read
            </button>
          </div>

          <ul className="notification-list">
            {allCategories.map((item) => (
              <li key={item.id} className="notification-item" onClick={() => navigate('/notifications')}>
                <div className="item-icon-box" style={{ backgroundColor: item.iconBg }}>
                  {item.icon}
                </div>
                <div className="item-content">
                  <span className="item-title">{item.title}</span>
                  {item.description && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.description}</span>
                  )}
                </div>
                <div className="item-right">
                  {item.id === 5 ? (
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: isLowTime ? '#ef4444' : '#10b981', 
                      backgroundColor: isLowTime ? '#fef2f2' : '#ecfdf5',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isLowTime ? '1px solid #fee2e2' : '1px solid #d1fae5'
                    }}>
                      {timeRemaining}
                    </span>
                  ) : (
                    item.count > 0 && (
                      <div className="item-count" style={{ backgroundColor: item.badgeBg }}>
                        {item.count}
                      </div>
                    )
                  )}
                  <ChevronRight className="arrow-icon" size={16} />
                </div>
              </li>
            ))}
          </ul>

          <div className="dropdown-footer">
            <a href="/notifications" className="view-all-link" onClick={handleViewAll}>
              View All Notifications <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
