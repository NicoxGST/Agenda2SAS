export type Worker = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type ClientSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
};
