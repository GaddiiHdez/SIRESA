import { useState, useEffect } from 'react';
import { apiGetCatalogos } from '../services/api';

export default function useCatalogos() {
  const [catalogos, setCatalogos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGetCatalogos();
        if (active) {
          setCatalogos(data);
        }
      } catch (err) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return { catalogos, loading, error };
}
