import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCurrentUsers, fetchMasterStages } from '../services/leadService';

const MasterDataContext = createContext({
  usersList: [],
  stagesList: [],
  loading: true,
  error: null,
  refreshMasterData: () => {}
});

export function MasterDataProvider({ children }) {
  const [usersList, setUsersList] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMasterData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      const [usersRes, stagesRes] = await Promise.all([
        fetchCurrentUsers(bypassCache),
        fetchMasterStages(bypassCache)
      ]);

      if (usersRes && usersRes.data) {
        setUsersList(usersRes.data || []);
      }
      if (stagesRes && stagesRes.data) {
        setStagesList(stagesRes.data || []);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load Master Data:', err);
      setError(err.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  return (
    <MasterDataContext.Provider
      value={{
        usersList,
        stagesList,
        loading,
        error,
        refreshMasterData: () => loadMasterData(true)
      }}
    >
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  return useContext(MasterDataContext);
}
