import { useMemo, useState, useCallback } from "react";
import { generateMockCreators } from "../data/mockCreators";
import { CreatorsContext } from "./creatorsContextDef";

export function CreatorsProvider({ children }) {
  const [creators, setCreators] = useState(() => generateMockCreators());
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const updateCreatorField = useCallback((id, field, value) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }, []);

  const deleteCreators = useCallback((ids) => {
    const idSet = new Set(ids);
    setCreators((prev) => prev.filter((c) => !idSet.has(c.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idSet.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const deleteCreator = useCallback(
    (id) => deleteCreators([id]),
    [deleteCreators]
  );

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectMany = useCallback((ids, shouldSelect) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (shouldSelect) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const getCreatorById = useCallback(
    (id) => creators.find((c) => c.id === id),
    [creators]
  );

  const selectedCreators = useMemo(
    () => creators.filter((c) => selectedIds.has(c.id)),
    [creators, selectedIds]
  );

  const value = useMemo(
    () => ({
      creators,
      setCreators,
      updateCreatorField,
      deleteCreator,
      deleteCreators,
      selectedIds,
      toggleSelected,
      selectMany,
      clearSelection,
      selectedCreators,
      getCreatorById,
    }),
    [
      creators,
      updateCreatorField,
      deleteCreator,
      deleteCreators,
      selectedIds,
      toggleSelected,
      selectMany,
      clearSelection,
      selectedCreators,
      getCreatorById,
    ]
  );

  return (
    <CreatorsContext.Provider value={value}>
      {children}
    </CreatorsContext.Provider>
  );
}
