import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";

// Loads data from the API; returns { data, loading, error, reload, setData }
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);
  const load = useCallback(async (silent = false) => {
    if (!path) return;
    const id = ++seq.current;
    if (!silent) setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(path);
      if (id === seq.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === seq.current) setState(s => ({ ...s, loading: false, error }));
    }
  }, [path]);
  useEffect(() => { load(); }, [load, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: load, setData: d => setState(s => ({ ...s, data: typeof d === "function" ? d(s.data) : d })) };
}

let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache);
  useEffect(() => { if (!metaCache) api("/meta").then(m => { metaCache = m; setMeta(m); }).catch(() => {}); }, []);
  return meta;
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
