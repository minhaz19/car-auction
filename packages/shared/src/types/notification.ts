export type NotificationType = 'outbid' | 'ending-soon' | 'won' | 'lost';

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  carId: string | { _id: string; make: string; model: string; year: number; images?: string[] };
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}
