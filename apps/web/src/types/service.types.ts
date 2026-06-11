export type Service = {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
};

export type ServicePayload = {
  name: string;
  description: string;
  price: number;
};
