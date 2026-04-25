// src/hooks/useDataFetching.js
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useDataFetching = (endpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await api.get(endpoint);
      setData(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Gagal memuat data');
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  const updateItem = useCallback((updatedItem) => {
    setData(prev => prev.map(item => 
      item._id === updatedItem._id ? updatedItem : item
    ));
  }, []);

  const removeItem = useCallback((id) => {
    setData(prev => prev.filter(item => item._id !== id));
  }, []);

  const addItem = useCallback((newItem) => {
    setData(prev => [...prev, newItem]);
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    updateItem,
    removeItem,
    addItem,
    setData,
  };
};