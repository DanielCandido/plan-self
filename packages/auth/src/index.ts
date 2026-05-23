type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

const hierarchy: Role[] = ['GUEST', 'MEMBER', 'MANAGER', 'ADMIN', 'OWNER'];

export const hasRole = (current: Role, minimum: Role) => hierarchy.indexOf(current) >= hierarchy.indexOf(minimum);
