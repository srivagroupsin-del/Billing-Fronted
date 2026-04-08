import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, XCircle } from 'lucide-react';
import './SearchableDropdown.css';

interface Option {
  id: string | number;
  label: string;
  [key: string]: any;
}

interface SearchableDropdownProps {
  options: Option[];
  value?: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select Option",
  searchPlaceholder = "Search...",
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => 
    options.find(opt => opt.id === value), 
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
        setSearch('');
        setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'Enter' || e.key === 'ArrowDown')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex]);
          }
          break;
        case 'Tab':
            setIsOpen(false);
            break;
      }
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && optionsListRef.current) {
      const focusedElement = optionsListRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="highlight">{part}</span> 
            : part
        )}
      </>
    );
  };

  return (
    <div className="searchable-dropdown" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={selectedOption ? 'selected-text' : 'placeholder-text'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`arrow-icon ${isOpen ? 'rotated' : ''}`} />
      </div>

      {isOpen && (
        <div className="dropdown-panel">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(0);
                }}
              />
            </div>
          </div>

          <div className="options-list" ref={optionsListRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`option-item ${value === option.id ? 'selected' : ''} ${focusedIndex === index ? 'focused' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className="option-label">
                    {highlightMatch(option.label, search)}
                  </span>
                  {value === option.id && <Check size={14} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="no-results">
                <XCircle size={20} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No results found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && <div className="dropdown-error">{error}</div>}
    </div>
  );
};

export default SearchableDropdown;
