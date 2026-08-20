// needType эски жазууларда жөнөкөй string, жаңыларында массив.
// Экөөнү тең массивге келтирет.
export const toNeedTypes = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export const needTypeLabel = (v) => toNeedTypes(v).join(', ');
