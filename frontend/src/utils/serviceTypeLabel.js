export const serviceTypeLabels = {
  NEW: '신규',
  MAINTENANCE: '유지보수',
  DEFECT_REPAIR: '하자보수',
  ETC: '기타'
};

export const getServiceTypeLabel = (serviceType) => serviceTypeLabels[serviceType] || serviceType || '-';
