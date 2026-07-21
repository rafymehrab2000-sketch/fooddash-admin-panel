export const colors = {
  navy: '#1A2744',
  navyDark: '#131D35',
  navyLight: '#24345A',
  amber: '#F5A623',
  amberDark: '#D98C0F',
  bg: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E7EAF1',
  text: '#1A2744',
  textMuted: '#6B7488',
  success: '#2E9E5B',
  danger: '#E5484D',
  warning: '#F5A623',
  info: '#2C7BE5',
};

export const statusColors = {
  pending: '#F5A623',
  accepted: '#2C7BE5',
  confirmed: '#2C7BE5',
  preparing: '#8854D0',
  ready: '#0FB5AE',
  out_for_delivery: '#0FB5AE',
  picked_up: '#0FB5AE',
  delivered: '#2E9E5B',
  cancelled: '#E5484D',
};

export const getStatusColor = (status) => statusColors[status] || '#888';
