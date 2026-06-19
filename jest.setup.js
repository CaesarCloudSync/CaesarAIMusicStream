import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Stateful react-native-track-player mock
const mockTrackPlayer = (() => {
  let queue = [];
  let activeIndex = 0;
  let state = 'none'; // none, playing, buffering, loading, ready, paused, stopped
  let listeners = {};

  return {
    State: {
      None: 'none',
      Playing: 'playing',
      Buffering: 'buffering',
      Loading: 'loading',
      Ready: 'ready',
      Paused: 'paused',
      Stopped: 'stopped',
    },
    Event: {
      PlaybackState: 'playback-state',
      PlaybackTrackChanged: 'playback-track-changed',
      PlaybackQueueEnded: 'playback-queue-ended',
      PlaybackError: 'playback-error',
      PlaybackProgressUpdated: 'playback-progress-updated',
      RemotePlay: 'remote-play',
      RemotePause: 'remote-pause',
      RemoteNext: 'remote-next',
      RemotePrevious: 'remote-previous',
    },
    RepeatMode: {
      Off: 'off',
      Track: 'track',
      Queue: 'queue',
    },
    setupPlayer: jest.fn().mockResolvedValue(true),
    getActiveTrackIndex: jest.fn().mockImplementation(async () => activeIndex),
    getActiveTrack: jest.fn().mockImplementation(async () => queue[activeIndex] || null),
    getTrack: jest.fn().mockImplementation(async (index) => queue[index] || null),
    getQueue: jest.fn().mockImplementation(async () => queue),
    reset: jest.fn().mockImplementation(async () => {
      queue = [];
      activeIndex = 0;
      state = 'none';
    }),
    seekTo: jest.fn().mockResolvedValue(true),
    add: jest.fn().mockImplementation(async (tracks) => {
      if (Array.isArray(tracks)) {
        queue.push(...tracks);
      } else {
        queue.push(tracks);
      }
    }),
    setRepeatMode: jest.fn().mockResolvedValue(true),
    play: jest.fn().mockImplementation(async () => {
      state = 'playing';
      if (listeners['playback-state']) {
        for (const listener of listeners['playback-state']) {
          await listener({ state: 'playing' });
        }
      }
    }),
    pause: jest.fn().mockImplementation(async () => {
      state = 'paused';
      if (listeners['playback-state']) {
        for (const listener of listeners['playback-state']) {
          await listener({ state: 'paused' });
        }
      }
    }),
    stop: jest.fn().mockImplementation(async () => {
      state = 'stopped';
      if (listeners['playback-state']) {
        for (const listener of listeners['playback-state']) {
          await listener({ state: 'stopped' });
        }
      }
    }),
    skip: jest.fn().mockImplementation(async (index) => {
      activeIndex = index;
      if (listeners['playback-track-changed']) {
        for (const listener of listeners['playback-track-changed']) {
          await listener({
            track: index,
            position: 0,
            nextTrack: index,
          });
        }
      }
    }),
    skipToPrevious: jest.fn().mockImplementation(async () => {
      if (activeIndex > 0) {
        activeIndex--;
      }
    }),
    setVolume: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockImplementation(async (index) => {
      if (Array.isArray(index)) {
        queue = queue.filter((_, idx) => !index.includes(idx));
      } else {
        queue.splice(index, 1);
      }
    }),
    addEventListener: jest.fn().mockImplementation((event, listener) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
      return {
        remove: () => {
          listeners[event] = listeners[event].filter(l => l !== listener);
        }
      };
    }),
    // Helper to simulate/emit events in tests
    _emit: async (event, payload) => {
      if (listeners[event]) {
        for (const listener of listeners[event]) {
          await listener(payload);
        }
      }
    },
    AppKilledPlaybackBehavior: {
      ContinuePlayback: 'continue-playback',
      PausePlayback: 'pause-playback',
    },
    Capability: {
      Play: 'play',
      Pause: 'pause',
      SkipToNext: 'skip-to-next',
      SkipToPrevious: 'skip-to-previous',
      Stop: 'stop',
    },
    usePlaybackState: jest.fn().mockReturnValue({ state: 'none' }),
    useTrackPlayerEvents: jest.fn(),
    useProgress: jest.fn().mockReturnValue({ position: 0, duration: 100 }),
    _getQueueInternal: () => queue,
    _setQueueInternal: (newQueue) => { queue = newQueue; },
    _setActiveIndexInternal: (idx) => { activeIndex = idx; },
    _getStateInternal: () => state,
  };
})();

jest.mock('react-native-track-player', () => mockTrackPlayer);

// Mock other native modules
jest.mock('@notifee/react-native', () => ({
  cancelNotification: jest.fn().mockResolvedValue(true),
  onForegroundEvent: jest.fn(),
  onBackgroundEvent: jest.fn(),
  EventType: {
    ACTION_PRESS: 'action_press',
  },
}));

jest.mock('@kesha-antonov/react-native-background-downloader', () => ({
  checkForExistingDownloads: jest.fn().mockResolvedValue([]),
  subscribeToDownloads: jest.fn(),
}));

jest.mock('react-native-volume-manager', () => ({
  VolumeManager: {
    addVolumeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    getVolume: jest.fn().mockResolvedValue({ volume: 0.8 }),
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/docs',
  exists: jest.fn().mockResolvedValue(true),
  writeFile: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
    Gesture: {
      Tap: () => ({
        numberOfTaps: () => ({ onEnd: (cb) => { cb({}, true); return this; } }),
        onEnd: (cb) => { cb({}, true); return this; },
      }),
      LongPress: () => ({
        onStart: (cb) => { cb(); return this; },
      }),
      Exclusive: (...gestures) => gestures,
    },
  };
});

jest.mock('./components/mqttclient/mqttclient', () => ({
  sendmusicconnect: jest.fn().mockResolvedValue(true),
  client: {
    connect: jest.fn(),
    subscribe: jest.fn(),
    send: jest.fn(),
  },
}));

jest.mock('react-native-inappbrowser-reborn', () => ({
  InAppBrowser: {
    isAvailable: jest.fn().mockResolvedValue(true),
    open: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

jest.mock('./components/musicconnectmqtt/MusicConnectMQTT', () => {
  const React = require('react');
  return () => null;
});

jest.mock('rn-fetch-blob', () => ({
  DocumentDir: jest.fn().mockReturnValue('/mock/docs'),
  config: jest.fn().mockReturnThis(),
  fetch: jest.fn().mockResolvedValue({
    info: () => ({ status: 200 }),
    path: () => '/mock/file.mp3',
  }),
  fs: {
    dirs: {
      DocumentDir: '/mock/docs',
    },
    exists: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: {
    audio: 'public.audio',
  },
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn().mockResolvedValue('granted'),
  request: jest.fn().mockResolvedValue('granted'),
  PERMISSIONS: {
    ANDROID: {
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
    IOS: {},
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}));

jest.mock('react-native-device-info', () => ({
  getSystemVersion: jest.fn().mockReturnValue('13.0'),
  getUniqueId: jest.fn().mockReturnValue('mock-unique-id'),
  getDeviceId: jest.fn().mockReturnValue('mock-device-id'),
}));

jest.mock('react-native-compressor', () => ({
  Image: {
    compress: jest.fn().mockResolvedValue('mock-compressed-path'),
  },
  Video: {
    compress: jest.fn().mockResolvedValue('mock-compressed-video-path'),
  },
}));

jest.mock('react-native-modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ModalComponent = ({ children, isVisible }) => {
    if (!isVisible) return null;
    return React.createElement(View, { testID: 'Modal' }, children);
  };
  ModalComponent.default = ModalComponent;
  return ModalComponent;
});

jest.mock('react-native-elements', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Button: ({ title, onPress }) => React.createElement(TouchableOpacity, { onPress }, React.createElement(Text, {}, title)),
  };
});

jest.mock('@rneui/base', () => {
  const React = require('react');
  const { TouchableOpacity, Text, TextInput } = require('react-native');
  return {
    Button: ({ title, onPress }) => React.createElement(TouchableOpacity, { onPress }, React.createElement(Text, {}, title)),
    Input: (props) => React.createElement(TextInput, props),
  };
});

const mockIcon = (name) => {
  const React = require('react');
  const { Text } = require('react-native');
  const IconComp = (props) => React.createElement(Text, props, name);
  IconComp.default = IconComp;
  return IconComp;
};

jest.mock('react-native-vector-icons/FontAwesome', () => mockIcon('FontAwesome'));
jest.mock('react-native-vector-icons/MaterialIcons', () => mockIcon('MaterialIcons'));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => mockIcon('MaterialCommunityIcons'));
jest.mock('react-native-vector-icons/Entypo', () => mockIcon('Entypo'));
jest.mock('react-native-vector-icons/AntDesign', () => mockIcon('AntDesign'));
jest.mock('react-native-vector-icons/FontAwesome5', () => mockIcon('FontAwesome5'));
