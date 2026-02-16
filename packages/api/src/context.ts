export interface UserContext {
  id: string;
  email: string;
  is_admin: boolean;
}

export interface CreateContextOptions {
  user: UserContext | null;
}

export function createContext(opts: CreateContextOptions) {
  return {
    user: opts.user,
  };
}

export type Context = ReturnType<typeof createContext>;
