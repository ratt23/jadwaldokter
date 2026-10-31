import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/apiConfig';

export const getVisitorId = () => {
    try {
        let vid = localStorage.getItem('shab_vid');
        if (!vid) {
            vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            localStorage.setItem('shab_vid', vid);
        }
        return vid;
    } catch (_) {
        return 'v_' + Date.now().toString(36);
    }
};

export const trackEvent = async (eventName, eventData = {}) => {
    try {
        const visitorId = getVisitorId();
        await fetch(`${getApiBaseUrl()}/analytics?action=track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: 'event',
                event_name: eventName,
                visitorId,
                ...eventData
            })
        });
    } catch (err) {
        console.error("Event Tracking Error", err);
    }
};

export default function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        const trackPage = async () => {
            try {
                // Check if new visitor for today
                const now = new Date().toISOString().split('T')[0];
                const lastVisit = localStorage.getItem('last_visit_date');
                const isNewVisitor = lastVisit !== now;

                if (isNewVisitor) {
                    localStorage.setItem('last_visit_date', now);
                }

                const visitorId = getVisitorId();

                // Get API Base URL
                const apiBase = getApiBaseUrl();

                // Collect Device Info
                const ua = navigator.userAgent;
                let device = 'Desktop';
                if (/Mobi|Android/i.test(ua)) device = 'Mobile';
                else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

                let browser = 'Unknown';
                if (ua.indexOf("Firefox") > -1) browser = "Firefox";
                else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
                else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
                else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
                else if (ua.indexOf("Edge") > -1) browser = "Edge";
                else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
                else if (ua.indexOf("Safari") > -1) browser = "Safari";

                const referrer = document.referrer;

                await fetch(`${apiBase}/analytics?action=track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        isNewVisitor,
                        visitorId,
                        path: location.pathname,
                        device,
                        browser,
                        referrer,
                        event_type: 'pageview'
                    })
                });
            } catch (err) {
                // Silent fail for analytics
            }
        };

        trackPage();
    }, [location]);

    return null;
}
