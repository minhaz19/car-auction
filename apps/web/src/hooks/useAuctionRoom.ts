'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { getSocket } from '@/lib/socket';
import { carsApi } from '@/store/services/carsApi';
import type {
  BidPlacedPayload,
  AuctionExtendedPayload,
  PresenceUpdatePayload,
  RoomJoinedPayload,
} from '@car-auction/shared';

export function useAuctionRoom(carId: string) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [watcherCount, setWatcherCount] = useState<number>(1);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [isExtendedAlert, setIsExtendedAlert] = useState(false);
  const [latestAuctionEnd, setLatestAuctionEnd] = useState<string | null>(null);

  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerExtendedAlert = useCallback(() => {
    setIsExtendedAlert(true);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      setIsExtendedAlert(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!carId) return;

    const socket = getSocket(token);

    if (!socket.connected) {
      socket.connect();
    }

    // Handshake join room
    socket.emit('join:room', { carId });

    // 1. Connection Event Listeners
    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit('join:room', { carId });
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };

    // 2. Room Joined / Server Sync
    const onRoomJoined = (data: RoomJoinedPayload) => {
      if (data.carId === carId) {
        setIsConnected(true);
        setIsReconnecting(false);
        setWatcherCount(data.watcherCount);
        setLatestAuctionEnd(data.auctionEnd);

        // Calculate offset: serverTime - localReceiptTime
        const localNow = Date.now();
        const offset = data.serverTime - localNow;
        setServerTimeOffset(offset);
      }
    };

    // 3. Presence Update
    const onPresenceUpdate = (data: PresenceUpdatePayload) => {
      if (data.carId === carId) {
        setWatcherCount(data.watcherCount);
      }
    };

    // 4. Live Bid Placed — RTK Query Cache Reconciliation
    const onBidPlaced = (data: BidPlacedPayload) => {
      if (data.carId === carId) {
        setLatestAuctionEnd(data.auctionEnd);

        // Update getCarById cache directly
        dispatch(
          carsApi.util.updateQueryData('getCarById', carId, (draft) => {
            draft.currentBid = data.currentBid;
            draft.bidCount = data.bidCount;
            draft.auctionEnd = data.auctionEnd;
          }),
        );

        // Update getCarBids cache directly (prepend new bid)
        dispatch(
          carsApi.util.updateQueryData(
            'getCarBids',
            { id: carId, page: 1, limit: 10 },
            (draft) => {
              // Avoid duplicates
              const exists = draft.bids.some((b) => b._id === data.newBid._id);
              if (!exists) {
                draft.bids.unshift(data.newBid);
                draft.total += 1;
              }
            },
          ),
        );
      }
    };

    // 5. Anti-Sniping Auction Extended
    const onAuctionExtended = (data: AuctionExtendedPayload) => {
      if (data.carId === carId) {
        setLatestAuctionEnd(data.newAuctionEnd);
        triggerExtendedAlert();

        dispatch(
          carsApi.util.updateQueryData('getCarById', carId, (draft) => {
            draft.auctionEnd = data.newAuctionEnd;
          }),
        );
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onRoomJoined);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('bid:placed', onBidPlaced);
    socket.on('auction:extended', onAuctionExtended);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:joined', onRoomJoined);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('bid:placed', onBidPlaced);
      socket.off('auction:extended', onAuctionExtended);

      socket.emit('leave:room', { carId });
    };
  }, [carId, token, dispatch, triggerExtendedAlert]);

  return {
    isConnected,
    isReconnecting,
    watcherCount,
    serverTimeOffset,
    isExtendedAlert,
    latestAuctionEnd,
  };
}
