import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getDocument, getCollection } from '../firebase/db';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const DEEP_FITNESS_ID = '0SOHig4HQsk4rdpfK0Ck';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]     = useState(null);
  const [role, setRole]                   = useState(null);
  const [userName, setUserName]           = useState('');
  const [gymId, setGymId]                 = useState(DEEP_FITNESS_ID);
  const [activeGymId, setActiveGymId]     = useState(DEEP_FITNESS_ID);
  const [gymData, setGymData]             = useState(null);
  const [gymIds, setGymIds]               = useState([DEEP_FITNESS_ID]);
  const [gymBranches, setGymBranches]     = useState([]);
  const [isSuperAdmin, setIsSuperAdmin]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [inactiveGymError, setInactiveGymError] = useState(false);
  const [gymBlockReason, setGymBlockReason] = useState(null);
  const [isPlanBlocked, setIsPlanBlocked] = useState(false);
  const [impersonatedGymId, setImpersonatedGymId]         = useState(null);
  const [impersonatedGymData, setImpersonatedGymData]     = useState(null);
  const [impersonatedBranches, setImpersonatedBranches]   = useState([]);

  const enterGym = (gym) => {
    setImpersonatedGymId(gym.id);
    setImpersonatedGymData(gym);
    setImpersonatedBranches([gym]);
  };

  const exitGym = () => {
    setImpersonatedGymId(null);
    setImpersonatedGymData(null);
    setImpersonatedBranches([]);
  };

  const switchImpersonatedBranch = (newGymId) => {
    const branch = impersonatedBranches.find(b => b.id === newGymId);
    if (branch) {
      setImpersonatedGymId(branch.id);
      setImpersonatedGymData(branch);
    }
  };

  const updateGymData = (partial) => {
    if (impersonatedGymId) {
      setImpersonatedGymData(prev => ({ ...prev, ...partial }));
    } else {
      setGymData(prev => ({ ...prev, ...partial }));
    }
  };

  const switchBranch = (newGymId) => {
    if (!gymIds.includes(newGymId)) return;
    if (newGymId === activeGymId) return;
    if (currentUser) {
      localStorage.setItem(`activeBranch_${currentUser.uid}`, newGymId);
    }
    window.location.href = '/';
  };

  const addBranch = (newGymId, newGymName) => {
    setGymIds(prev => [...prev, newGymId]);
    setGymBranches(prev => [...prev, { id: newGymId, name: newGymName }]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDocument('users', user.uid);
          if (userDoc && userDoc.role === 'deleted') {
            setInactiveGymError(true);
            await signOut(auth);
            return;
          }

          // In Deep Fitness ERP, all authorized users directly open Deep Fitness Gym
          const targetGymId = userDoc?.gymId || DEEP_FITNESS_ID;
          const allGymIds = (userDoc?.gymIds && userDoc.gymIds.length > 0)
            ? userDoc.gymIds
            : [targetGymId];

          setGymId(targetGymId);
          setGymIds(allGymIds);

          const saved = localStorage.getItem(`activeBranch_${user.uid}`);
          const resolvedActiveId = (saved && allGymIds.includes(saved))
            ? saved
            : targetGymId;

          setActiveGymId(resolvedActiveId);

          const branchDocs = await Promise.all(allGymIds.map(id => getDocument('gyms', id)));
          const branches = branchDocs.map((g, i) => ({
            id: allGymIds[i],
            name: g?.name || `Branch ${i + 1}`,
          }));
          setGymBranches(branches);

          const activeIdx = allGymIds.indexOf(resolvedActiveId);
          const activeGym = activeIdx >= 0 ? branchDocs[activeIdx] : branchDocs[0];

          setGymData(activeGym || { id: DEEP_FITNESS_ID, name: 'Deep Fitness Gym' });
          setIsPlanBlocked(false);
          setInactiveGymError(false);
          setGymBlockReason(null);

          setRole(userDoc?.role === 'staff' ? 'staff' : 'admin');
          setUserName(userDoc?.name || user.displayName || 'Deep Fitness Admin');
          setIsSuperAdmin(false);
        } catch (err) {
          console.error('Error loading user/gym:', err);
          const gymDoc = await getDocument('gyms', DEEP_FITNESS_ID);
          setGymData(gymDoc || { id: DEEP_FITNESS_ID, name: 'Deep Fitness Gym' });
          setGymId(DEEP_FITNESS_ID);
          setActiveGymId(DEEP_FITNESS_ID);
          setRole('admin');
          setUserName(user.displayName || user.email?.split('@')[0] || 'Deep Fitness Admin');
        }
      } else {
        setRole(null);
        setUserName('');
        setGymId(DEEP_FITNESS_ID);
        setActiveGymId(DEEP_FITNESS_ID);
        setGymIds([DEEP_FITNESS_ID]);
        setGymBranches([]);
        setGymData(null);
        setIsSuperAdmin(false);
        setIsPlanBlocked(false);
        setGymBlockReason(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    setInactiveGymError(false);
    setGymBlockReason(null);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      currentUser, role, userName,
      gymId: impersonatedGymId ?? activeGymId,
      gymData: impersonatedGymData ?? gymData,
      gymIds,
      gymBranches,
      isSuperAdmin,
      inactiveGymError,
      gymBlockReason,
      isPlanBlocked,
      isImpersonating: false,
      impersonatedBranches,
      enterGym, exitGym, updateGymData,
      switchBranch, addBranch, switchImpersonatedBranch,
      login, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
