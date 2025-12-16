export const jitsiConfig = {
  roomNamePrefix: 'quran-class-',
  domain: 'meet.jit.si',
  options: {
    width: '100%',
    height: '100%',
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      prejoinPageEnabled: false,
      disableModeratorIndicator: true,
      enableWelcomePage: false,
      enableClosePage: true,
      enableNoAudioDetection: false,
      enableNoisyMicDetection: false,
      requireDisplayName: false,
      disableShortcuts: false,
      disable1On1Mode: false,
      enableLayerSuspension: false,
      startAudioOnly: false,
      startScreenSharing: false,
      enableEmailInStats: false,
      enableCalendarIntegration: false,
      deepLinking: {
        mobile: {
          ios: {},
          android: {}
        },
        desktop: {}
      }
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      FILM_STRIP_MAX_HEIGHT: 120,
      INITIAL_TOOLBAR_TIMEOUT: 20000,
      TOOLBAR_TIMEOUT: 4000,
      TOOLBAR_ALWAYS_VISIBLE: false,
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      SHOW_DEEP_LINKING_IMAGE: false,
      GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
      DISPLAY_WELCOME_PAGE_CONTENT: false,
      DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
      MOBILE_APP_PROMO: false,
      DEFAULT_REMOTE_DISPLAY_NAME: 'Student',
      DEFAULT_LOCAL_DISPLAY_NAME: 'Teacher',
      APP_NAME: 'Quran PWA',
      NATIVE_APP_NAME: 'Quran PWA',
      PROVIDER_NAME: 'Quran Academy',
      LANG_DETECTION: false,
      INVITATION_POWERED_BY: false,
      AUTHENTICATION_ENABLE: false,
      VERTICAL_FILMSTRIP: true,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
        'mute-video-everyone', 'security'
      ],
    },
    userInfo: {
      displayName: 'Teacher',
      email: ''
    }
  }
};