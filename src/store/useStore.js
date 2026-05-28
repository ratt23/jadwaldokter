import { create } from 'zustand';
import { getApiBaseUrl } from '../utils/apiConfig';

export const useStore = create((set, get) => ({
  // Search State
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Config State
  config: {
    logoUrl: '/asset/logo/logo.png', // Default
    themeColor: '#01007f', // Default Blue
    hospitalName: 'RSU Siloam Ambon',
    hospitalShortName: 'Siloam Ambon',
    hospitalTagline: 'Kesehatan Anda, Prioritas Kami',
    hospitalPhone: '1-500-911',
    hospitalAddress: 'Jl. Sultan Hasanudin, Tantui, Ambon',
    hospitalEmail: 'info@siloamhospitals.com',

    headerSlides: [ // Default static slides
      {
        type: 'text',
        title: 'Jadwal Poliklinik',
        subtitle: 'RSU Siloam Ambon',
        color: '#01007f'
      },
      {
        type: 'text',
        title: '1-500-911',
        subtitle: '24/7 Emergency & Contact Center',
        color: '#D92D20'
      }
    ],
    menu: [ // Default menu
      { id: 1, label: 'Home', url: '/home', icon: 'home' },
      { id: 2, label: 'MCU', url: '/mcu', icon: 'clipboard' },
      { id: 3, label: 'Home Care', url: '/homecare', icon: 'heart' },
      { id: 4, label: 'Article', url: '/article', icon: 'file-text' }
    ],
    doctorPriority: {}, // Default empty
    features: {
      polyclinicToday: true,
      doctorLeave: true,
      googleReview: true
    },
    whatsappNumber: '6285158441599', // Default fallback
    whatsappEnabled: true,
    loading: true,
    error: null
  },

  // Actions
  loadConfig: async () => {
    set(state => ({ config: { ...state.config, loading: true, error: null } }));
    try {
      const apiBase = getApiBaseUrl();

      // Fetch settings from API
      console.log('Fetching settings from API...');
      const response = await fetch(`${apiBase}/settings`);

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();

      // Store in local storage cache
      localStorage.setItem('cache_settings', JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      const processedConfig = get().processSettings(data);

      // Fetch Doctor Schedule Updates
      let manualIds = [];
      if (data.manual_update_list && data.manual_update_list.value) {
        try {
          manualIds = JSON.parse(data.manual_update_list.value);
        } catch (e) {
          console.warn('Error parsing manual_update_list', e);
        }
      }

      await get().fetchUpdates(manualIds, processedConfig);

    } catch (err) {
      console.error('Config Fetch Error:', err);
      set(state => ({
        config: {
          ...state.config,
          loading: false,
          error: err.message
        }
      }));
    }
  },

  processSettings: (data) => {
    const { config } = get();

    // Helper to safely parse JSON
    const safeParse = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    };

    // Extract all settings
    const logoUrl = data.logo_url?.value || config.logoUrl;
    const themeColor = data.theme_color?.value || config.themeColor;
    const hospitalName = data.hospital_name?.value || config.hospitalName;
    const hospitalShortName = data.hospital_short_name?.value || config.hospitalShortName;
    const hospitalTagline = data.hospital_tagline?.value || config.hospitalTagline;
    const hospitalPhone = data.hospital_phone?.value || config.hospitalPhone;
    const hospitalAddress = data.hospital_address?.value || config.hospitalAddress;
    const hospitalEmail = data.hospital_email?.value || config.hospitalEmail;
    const headerSlides = safeParse(data.header_slides?.value, []);
    const menu = safeParse(data.menu?.value, []);
    const doctorPriority = safeParse(data.doctor_priority?.value, {});
    const whatsappNumber = data.whatsapp_number?.value || config.whatsappNumber;
    const whatsappEnabled = data.whatsapp_enabled?.is_enabled ?? true;
    const slideshowRefreshInterval = parseInt(data.slideshow_refresh_interval?.value || '24', 10);

    let manualUpdateIds = [];
    if (data.manual_update_list?.value) {
      try {
        manualUpdateIds = JSON.parse(data.manual_update_list.value);
      } catch (e) {
        console.warn('Error parsing manual IDs in processSettings', e);
      }
    }

    const features = {
      polyclinicToday: (data.feature_polyclinic_today?.is_enabled ?? data.feature_polyclinic_today?.enabled) ?? true,
      doctorLeave: (data.feature_doctor_leave?.is_enabled ?? data.feature_doctor_leave?.enabled) ?? true,
      googleReview: (data.feature_google_review?.is_enabled ?? data.feature_google_review?.enabled) ?? false,
      headerSlider: (data.feature_header_slider?.is_enabled ?? data.feature_header_slider?.enabled) ?? true,
      scheduleUpdate: (data.feature_schedule_update?.is_enabled ?? data.feature_schedule_update?.enabled) ?? true
    };

    const newConfig = {
      ...config,
      logoUrl,
      themeColor,
      hospitalName,
      hospitalShortName,
      hospitalTagline,
      hospitalPhone,
      hospitalAddress,
      hospitalEmail,
      headerSlides: (headerSlides && headerSlides.length > 0) ? headerSlides : config.headerSlides,
      menu: (menu && menu.length > 0) ? menu : config.menu,
      doctorPriority,
      features,
      whatsappNumber,
      whatsappEnabled,
      slideshowRefreshInterval,
      manualUpdateIds,
      loading: false
    };

    set({ config: newConfig });
    return newConfig;
  },

  fetchUpdates: async (manualIds = [], processedConfig) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/doctors/grouped`);
      if (!response.ok) return;

      const data = await response.json();

      const updatedDoctors = [];
      const addedIds = new Set();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      let maxTimestamp = 0;

      const hasManualUpdates = manualIds && manualIds.length > 0;
      console.log('[useStore] Fetching updates. Manual Mode:', hasManualUpdates, 'IDs:', manualIds);

      Object.entries(data).forEach(([key, cat]) => {
        cat.doctors.forEach(doc => {
          const t = doc.updated_at ? new Date(doc.updated_at).getTime() : 0;
          if (t > maxTimestamp) maxTimestamp = t;

          let isMatch = false;

          if (hasManualUpdates) {
            isMatch = manualIds.includes(doc.id) || manualIds.includes(String(doc.id));
          } else {
            isMatch = doc.updated_at && new Date(doc.updated_at) > threeDaysAgo;
          }

          if (isMatch && !addedIds.has(doc.id)) {
            updatedDoctors.push({
              name: doc.name,
              image: doc.image_url,
              specialty: cat.title || 'Spesialis',
              specialtyKey: key
            });
            addedIds.add(doc.id);
          }
        });
      });

      const currentHeaderSlides = processedConfig?.headerSlides || get().config.headerSlides;

      if (updatedDoctors.length > 0) {
        if (!get().config.features.scheduleUpdate) return;

        const chunkSize = 2;
        const updateSlides = [];

        for (let i = 0; i < updatedDoctors.length; i += chunkSize) {
          const chunk = updatedDoctors.slice(i, i + chunkSize);
          updateSlides.push({
            type: 'doctor-updates',
            title: 'UPDATE JADWAL',
            data: chunk,
            color: '#16a34a',
            marquee: false,
            isNotification: true
          });
        }

        const existingSlides = currentHeaderSlides.filter(s => !s.isNotification);

        set(state => ({
          config: {
            ...state.config,
            headerSlides: [...updateSlides, ...existingSlides]
          }
        }));
      } else if (maxTimestamp > 0 && manualIds.length === 0) {
        if (!get().config.features.scheduleUpdate) return;

        const dateStr = new Date(maxTimestamp).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const existingSlides = currentHeaderSlides.filter(s => !s.isNotification);
        const notificationSlide = {
          type: 'text',
          title: 'INFO UPDATE',
          subtitle: `Update Terakhir: ${dateStr}`,
          color: '#01007f',
          marquee: false,
          isNotification: true
        };

        set(state => ({
          config: {
            ...state.config,
            headerSlides: [...existingSlides, notificationSlide]
          }
        }));
      }

    } catch (e) {
      console.warn('Failed to fetch updates', e);
    }
  }
}));
