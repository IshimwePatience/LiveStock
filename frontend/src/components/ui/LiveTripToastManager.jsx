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
    refetchInterval: 10000, // 10 seconds polling interval
  });

  // Keep tracking state per vehicle device
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
      const otp = loc.route.otp || loc.route.endOtp || 'N/A';
      const speedKmh = loc.speed ? (loc.speed * 1.852).toFixed(0) : 0;
      const isMoving = parseFloat(speedKmh) > 2;

      let prevState = vehicleStateRef.current.get(deviceId) || {
        lastOriginToastTime: 0,
        lastEnRouteToastTime: 0,
        lastStopWarningTime: 0,
        lastMovingTime: now,
        originStartTime: now,
        wasMoving: false,
        hasNotifiedDeparted: false,
        hasNotifiedArrived: false
      };

      // --------------------------------------------------------------------------
      // 1. RULE: Car at Origin (pickup point) — Show reminder every 3 minutes (180,000 ms)
      // --------------------------------------------------------------------------
      if (tripStatus === 'SCHEDULED' || (!isMoving && !prevState.hasNotifiedDeparted)) {
        if (!prevState.originStartTime) prevState.originStartTime = now;
        const timeAtOriginMs = now - prevState.originStartTime;
        const hoursAtOrigin = Math.floor(timeAtOriginMs / (1000 * 60 * 60));

        if (now - prevState.lastOriginToastTime >= 180000 || prevState.lastOriginToastTime === 0) {
          if (hoursAtOrigin >= 24) {
            toast.error(
              (t) => (
                <div className="flex flex-col gap-1">
                  <span className="font-extrabold text-sm text-red-200">🚨 CRITICAL ORIGIN DELAY (&gt;24 Hours)</span>
                  <span className="text-xs text-white">Vehicle <strong>{plate}</strong> has been waiting at origin (<strong>{origin}</strong>) for {hoursAtOrigin} hours (1+ days)!</span>
                </div>
              ),
              { duration: 10000, id: `origin-delay-${deviceId}` }
            );
          } else if (hoursAtOrigin >= 2) {
            toast.error(
              (t) => (
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm text-amber-100">🚨 ORIGIN DELAY ({hoursAtOrigin} Hours)</span>
                  <span className="text-xs text-white">Vehicle <strong>{plate}</strong> is still at origin (<strong>{origin}</strong>) awaiting livestock loading.</span>
                </div>
              ),
              { duration: 8000, id: `origin-delay-${deviceId}` }
            );
          } else {
            toast(
              (t) => (
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-xs text-blue-100">🅿️ ORIGIN REMINDER (Pickup Point)</span>
                  <span className="text-xs text-white">Vehicle <strong>{plate}</strong> is at origin (<strong>{origin}</strong>) waiting to load &amp; depart.</span>
                </div>
              ),
              {
                icon: '🅿️',
                duration: 6000,
                id: `origin-remind-${deviceId}`,
                style: { background: '#1e293b', color: '#fff', borderLeft: '4px solid #3b82f6' }
              }
            );
          }
          prevState.lastOriginToastTime = now;
        }
      }

      // --------------------------------------------------------------------------
      // 2. RULE: Once car starts moving toward destination — Show departure reminder!
      // --------------------------------------------------------------------------
      if (isMoving && !prevState.wasMoving && !prevState.hasNotifiedDeparted) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-sm text-emerald-100">🚀 CAR STARTED MOVING!</span>
              <span className="text-xs text-white">Vehicle <strong>{plate}</strong> departed from <strong>{origin}</strong> toward <strong>{dest}</strong> at {speedKmh} km/h!</span>
            </div>
          ),
          {
            duration: 10000,
            id: `departure-${deviceId}`,
            style: { background: '#065f46', color: '#fff', borderLeft: '4px solid #10b981' }
          }
        );
        prevState.hasNotifiedDeparted = true;
      }

      // --------------------------------------------------------------------------
      // 3. RULE: While car is on the way — Keep showing "Car is here" toast every 3 minutes (180,000 ms)
      // --------------------------------------------------------------------------
      if (isMoving && (tripStatus === 'ACTIVE' || tripStatus === 'IN_TRANSIT' || prevState.hasNotifiedDeparted)) {
        if (now - prevState.lastEnRouteToastTime >= 180000 || prevState.lastEnRouteToastTime === 0) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-xs text-blue-200">🚚 CAR IS EN ROUTE!</span>
                <span className="text-xs text-white">Vehicle <strong>{plate}</strong> is on the way to <strong>{dest}</strong> moving at <strong>{speedKmh} km/h</strong>.</span>
              </div>
            ),
            {
              icon: '🚚',
              duration: 6000,
              id: `enroute-${deviceId}`,
              style: { background: '#1e3a8a', color: '#fff', borderLeft: '4px solid #60a5fa' }
            }
          );
          prevState.lastEnRouteToastTime = now;
        }
        prevState.lastMovingTime = now; // update last moving timestamp
      }

      // --------------------------------------------------------------------------
      // 4. RULE: Car stops for > 5 minutes (300,000 ms) en route — Show Warning Toast!
      // --------------------------------------------------------------------------
      if (!isMoving && prevState.hasNotifiedDeparted && tripStatus !== 'ARRIVED' && tripStatus !== 'COMPLETED') {
        const stoppedDurationMs = now - prevState.lastMovingTime;
        const stoppedMins = Math.floor(stoppedDurationMs / 60000);

        if (stoppedDurationMs >= 300000 && (now - prevState.lastStopWarningTime >= 300000 || prevState.lastStopWarningTime === 0)) {
          toast.error(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-sm text-rose-200">⚠️ CAR STOPPED WARNING (&gt;5 Mins)</span>
                <span className="text-xs text-white">Vehicle <strong>{plate}</strong> has been stopped for <strong>{stoppedMins} minutes</strong> en route to <strong>{dest}</strong>!</span>
              </div>
            ),
            {
              duration: 10000,
              id: `stop-warn-${deviceId}`,
              style: { background: '#881337', color: '#fff', borderLeft: '4px solid #f43f5e' }
            }
          );
          prevState.lastStopWarningTime = now;
        }
      }

      // --------------------------------------------------------------------------
      // 5. RULE: Car reaches destination — Show toast notification to give driver OTP code!
      // --------------------------------------------------------------------------
      if (tripStatus === 'ARRIVED' && !prevState.hasNotifiedArrived) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1.5 p-1">
              <span className="font-extrabold text-sm text-amber-200">🏁 DESTINATION REACHED!</span>
              <span className="text-xs text-white">Vehicle <strong>{plate}</strong> arrived at <strong>{dest}</strong>.</span>
              <div className="bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded text-xs tracking-wider flex items-center justify-between border border-amber-300 shadow-sm mt-1">
                <span>🔑 GIVE OTP TO DRIVER:</span>
                <span className="text-sm font-mono bg-slate-900 text-amber-300 px-2 py-0.5 rounded">{otp}</span>
              </div>
            </div>
          ),
          {
            duration: 20000, // keep on screen 20 seconds
            id: `arrival-otp-${deviceId}`,
            style: { background: '#064e3b', color: '#fff', borderLeft: '6px solid #f59e0b', padding: '16px 20px' }
          }
        );
        prevState.hasNotifiedArrived = true;
      }

      prevState.wasMoving = isMoving;
      vehicleStateRef.current.set(deviceId, prevState);
    });
  }, [locations]);

  return null;
};

export default LiveTripToastManager;
