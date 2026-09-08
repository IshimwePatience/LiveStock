import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTraccarLocations } from '../../lib/api';

const LiveTripToastManager = () => {
  // Poll live GPS positions & trip statuses every 10 seconds
  const { data: locations } = useQuery({
    queryKey: ['live-trip-reminders'],
    queryFn: async () => {
      const res = await getTraccarLocations();
      return res.data;
    },
    refetchInterval: 10000, // 10s interval
  });

  // Keep state per vehicle device
  const vehicleStateRef = useRef(new Map());

  useEffect(() => {
    if (!locations || !Array.isArray(locations)) return;

    const now = Date.now();

    locations.forEach(loc => {
      if (!loc.route) return;

      const deviceId = loc.deviceId || loc.deviceName;
      const plate = loc.deviceName || 'Vehicle';
      const origin = loc.route.origin || 'Origin';
      const dest = loc.route.destination || 'Destination';
      const tripStatus = loc.route.tripStatus || 'SCHEDULED';
      const otp = loc.route.otp || 'N/A';
      const speedKmh = loc.speed ? (loc.speed * 1.852).toFixed(0) : 0;
      const isMoving = speedKmh > 2;

      let prevState = vehicleStateRef.current.get(deviceId) || {
        lastOriginToastTime: 0,
        lastEnRouteToastTime: 0,
        lastStopWarningTime: 0,
        lastMovingTime: now,
        wasMoving: false,
        hasNotifiedDeparted: false,
        hasNotifiedArrived: false
      };

      // 1. RULE: Car at origin (pickup point) — Toast reminder every 3 minutes (180,000ms) + Long Delay Alerts
      if (tripStatus === 'SCHEDULED' || (!isMoving && !prevState.hasNotifiedDeparted)) {
        const timeAtOriginMs = now - (prevState.originStartTime || now);
        if (!prevState.originStartTime) prevState.originStartTime = now;

        const hoursAtOrigin = Math.floor(timeAtOriginMs / (1000 * 60 * 60));

        if (now - prevState.lastOriginToastTime > 180000 || prevState.lastOriginToastTime === 0) {
          if (hoursAtOrigin >= 24) {
            toast.error(`🚨 CRITICAL OVERDUE: Vehicle ${plate} has been delayed at origin (${origin}) for > 24 hours (1+ days)! Check permit status.`, {
              duration: 10000
            });
          } else if (hoursAtOrigin >= 2) {
            toast.error(`🚨 ORIGIN DELAY: Vehicle ${plate} has been waiting at origin (${origin}) for ${hoursAtOrigin} hours!`, {
              duration: 8000
            });
          } else {
            toast(`🅿️ REMINDER: Vehicle ${plate} is at origin (${origin}) awaiting pickup & departure.`, {
              icon: '🅿️',
              duration: 6000
            });
          }
          prevState.lastOriginToastTime = now;
        }
      }

      // 2. RULE: Once car starts moving toward destination — Show departure reminder!
      if (isMoving && !prevState.wasMoving && !prevState.hasNotifiedDeparted) {
        toast.success(`🚀 DEPARTURE ALERT: Vehicle ${plate} has started moving from ${origin} toward ${dest}!`, {
          duration: 9000
        });
        prevState.hasNotifiedDeparted = true;
      }

      // 3. RULE: While car is on the way — Toast reminder every 4 minutes (240,000ms)
      if (isMoving && (tripStatus === 'ACTIVE' || tripStatus === 'IN_TRANSIT' || prevState.hasNotifiedDeparted)) {
        if (now - prevState.lastEnRouteToastTime > 240000) {
          toast(`🚚 EN ROUTE: Vehicle ${plate} is moving at ${speedKmh} km/h toward ${dest}.`, {
            icon: '🚚',
            duration: 6000
          });
          prevState.lastEnRouteToastTime = now;
        }
        prevState.lastMovingTime = now;
      }

      // 4. RULE: Car stops for > 5 minutes (300,000ms) en route — Warning toast!
      if (!isMoving && prevState.hasNotifiedDeparted && tripStatus !== 'ARRIVED' && tripStatus !== 'COMPLETED') {
        const stoppedDurationMs = now - prevState.lastMovingTime;
        if (stoppedDurationMs >= 300000 && (now - prevState.lastStopWarningTime > 300000)) {
          toast.error(`⚠️ STOPPED WARNING: Vehicle ${plate} has been stationary for > 5 mins en route to ${dest}!`, {
            duration: 10000
          });
          prevState.lastStopWarningTime = now;
        }
      }

      // 5. RULE: Car reaches destination — Toast notification telling officer/initiator to provide OTP!
      if (tripStatus === 'ARRIVED' && !prevState.hasNotifiedArrived) {
        toast.success(`🏁 ARRIVAL NOTICE: Vehicle ${plate} reached destination ${dest}! Provide/Issue OTP code [${otp}] to the driver.`, {
          duration: 15000
        });
        prevState.hasNotifiedArrived = true;
      }

      prevState.wasMoving = isMoving;
      vehicleStateRef.current.set(deviceId, prevState);
    });
  }, [locations]);

  return null;
};

export default LiveTripToastManager;
