import { POOL_STATUSES } from "./constants";

interface PoolMemberWithPool {
  pool: {
    status: string;
  };
  updatedAt?: string | Date;
  [key: string]: any;
}

export function sortPoolMembersByPoolStatus<T extends PoolMemberWithPool>(
  poolMembers: T[]
): T[] {
  const statusOrder = ["Active", "Open", "Locked", "Complete", "Setup"];

  return [...poolMembers].sort((a, b) => {
    const indexA = statusOrder.indexOf(a.pool.status);
    const indexB = statusOrder.indexOf(b.pool.status);

    if (indexA !== indexB) return indexA - indexB;

    // More recently updated first
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
}
