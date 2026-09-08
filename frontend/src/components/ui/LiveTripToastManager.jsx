import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTraccarLocations } from '../../lib/api';

// Custom Toast Renderer matching user's green toast UI (#15803d, #14532d shadow, white text, (x) close icon, no emojis, right-side slide-in)
const showRightSlideToast = (id, messageText, duration = 6000) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-in slide-in-from-right duration-300 ease-out' : 'animate-out fade-out duration-200'
        } max-w-md w-full bg-[#15803d] text-white shadow-[0_4px_0_0_#14532d] rounded-xl p-4 flex items-center gap-3 font-sans pointer-events-auto border border-emerald-600/30 transition-all`}
      >
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 text-white hover:bg-emerald-800/50 rounded-full transition-colors shrink-0 cursor-pointer"
          title="Close notification"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </button>
        <div className="flex flex-col text-[14px] font-bold leading-snug">
          {messageText}
        </div>
      </div>
    ),
    { id, duration, position: 'top-right' }
  );
};

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
          let msg = `Imodoka ${plate} iri ku nkomoko (${origin}) irategereza gukura no guhaguruka.`;
          if (hoursAtOrigin >= 24) {
            msg = `Imodoka ${plate} imaze amasaha irenga 24 (${hoursAtOrigin}h) ikiri ku nkomoko (${origin}).`;
          } else if (hoursAtOrigin >= 2) {
            msg = `Imodoka ${plate} imaze amasaha ${hoursAtOrigin} ikiri ku nkomoko (${origin}).`;
          }

          showRightSlideToast(`origin-remind-${deviceId}`, msg, 6000);
          prevState.lastOriginToastTime = now;
        }
      }

      // --------------------------------------------------------------------------
      // 2. RULE: Once car starts moving toward destination — Show departure reminder!
      // --------------------------------------------------------------------------
      if (isMoving && !prevState.wasMoving && !prevState.hasNotifiedDeparted) {
        const msg = `Imodoka ${plate} yahagurutse ku nkomoko (${origin}) yerekeza (${dest}) ku muvuduko wa ${speedKmh} km/h.`;
        showRightSlideToast(`departure-${deviceId}`, msg, 8000);
        prevState.hasNotifiedDeparted = true;
      }

      // --------------------------------------------------------------------------
      // 3. RULE: While car is on the way — Keep showing "Car is here" toast every 3 minutes (180,000 ms)
      // --------------------------------------------------------------------------
      if (isMoving && (tripStatus === 'ACTIVE' || tripStatus === 'IN_TRANSIT' || prevState.hasNotifiedDeparted)) {
        if (now - prevState.lastEnRouteToastTime >= 180000 || prevState.lastEnRouteToastTime === 0) {
          const msg = `Imodoka ${plate} iri mu nzira yerekeza (${dest}) ku muvuduko wa ${speedKmh} km/h.`;
          showRightSlideToast(`enroute-${deviceId}`, msg, 6000);
          prevState.lastEnRouteToastTime = now;
        }
        prevState.lastMovingTime = now;
      }

      // --------------------------------------------------------------------------
      // 4. RULE: Car stops for > 5 minutes (300,000 ms) en route — Show Warning Toast!
      // --------------------------------------------------------------------------
      if (!isMoving && prevState.hasNotifiedDeparted && tripStatus !== 'ARRIVED' && tripStatus !== 'COMPLETED') {
        const stoppedDurationMs = now - prevState.lastMovingTime;
        const stoppedMins = Math.floor(stoppedDurationMs / 60000);

        if (stoppedDurationMs >= 300000 && (now - prevState.lastStopWarningTime >= 300000 || prevState.lastStopWarningTime === 0)) {
          const msg = `Imodoka ${plate} imaze iminota ${stoppedMins} ihagaze mu nzira yerekeza (${dest}).`;
          showRightSlideToast(`stop-warn-${deviceId}`, msg, 10000);
          prevState.lastStopWarningTime = now;
        }
      }

      // --------------------------------------------------------------------------
      // 5. RULE: Car reaches destination — Show toast notification to give driver OTP code!
      // --------------------------------------------------------------------------
      if (tripStatus === 'ARRIVED' && !prevState.hasNotifiedArrived) {
        const msg = `Imodoka ${plate} yageze aho yajyaga (${dest}). Tangira umushoferi kode ya OTP: [ ${otp} ].`;
        showRightSlideToast(`arrival-otp-${deviceId}`, msg, 20000);
        prevState.hasNotifiedArrived = true;
      }

      prevState.wasMoving = isMoving;
      vehicleStateRef.current.set(deviceId, prevState);
    });
  }, [locations]);

  return null;
};

export default LiveTripToastManager;
