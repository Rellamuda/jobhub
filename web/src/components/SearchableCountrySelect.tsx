'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Country, phoneCodes, countriesList } from '../lib/countriesData';

interface SearchableCountrySelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableCountrySelect({
  value,
  onChange,
  placeholder = 'Select Country',
  label,
  required,
  disabled,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countriesList.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }} ref={containerRef}>
      {label && (
        <label style={{ display: 'block', color: 'white', fontSize: '0.9rem', marginBottom: '0.35rem', fontWeight: 500 }}>
          {label} {required && <span style={{ color: '#00F0FF' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        style={{
          width: '100%',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.15)',
          color: value ? 'white' : 'rgba(255, 255, 255, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: '0.95rem',
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.6)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#16122E',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)' }}>
            <Search size={16} style={{ color: '#00F0FF' }} />
            <input
              type="text"
              placeholder="Type to search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '0.9rem',
                width: '100%',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* List Options */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredCountries.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                No country found matching "{searchTerm}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c === value;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                      color: isSelected ? '#00F0FF' : 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{c}</span>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SearchablePhoneCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function SearchablePhoneCodeSelect({ value, onChange, disabled }: SearchablePhoneCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEntry = phoneCodes.find((pc) => pc.code === value);

  const filteredCodes = phoneCodes.filter(
    (pc) =>
      pc.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      pc.code.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <div style={{ position: 'relative', width: '130px', minWidth: '130px' }} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        style={{
          width: '100%',
          padding: '0.85rem 0.6rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.15)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}
      >
        <span>{value || '+1'}</span>
        <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.6)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: '#16122E',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            width: '280px',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)' }}>
            <Search size={14} style={{ color: '#00F0FF' }} />
            <input
              type="text"
              placeholder="Search country or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List Options */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredCodes.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                No code found
              </div>
            ) : (
              filteredCodes.map((pc) => {
                const isSelected = pc.code === value;
                return (
                  <button
                    key={pc.code + pc.name}
                    type="button"
                    onClick={() => {
                      onChange(pc.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                      color: isSelected ? '#00F0FF' : 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      <strong>{pc.code}</strong> {pc.name}
                    </span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
