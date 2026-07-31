export const getMapDetailId = (pathname?: string | null) => {
  const match = pathname?.match(/^\/map\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number.parseInt(match[1], 10);
  return Number.isNaN(id) ? null : id;
};

export const shouldRestoreMapList = (search: string) => new URLSearchParams(search).get('list') === 'open';
