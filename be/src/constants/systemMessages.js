const SYSTEM_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Authentication successful.',
    REGISTER_SUCCESS: 'User registered successfully.',
    UNAUTHORIZED: 'Access denied. Missing or invalid authentication token.',
    USER_NOT_FOUND: 'User account not found.',
    INVALID_CREDENTIALS: 'Invalid username or password.',
  },
  SONG: {
    FOUND: 'Song retrieved successfully.',
    NOT_FOUND: 'Requested song could not be found.',
    INVALID_ID: 'Invalid YouTube Video ID format provided.',
  },
  PLAYLIST: {
    SYNCED: 'Playlists successfully synchronized with Google Sheet cloud.',
    FETCHED: 'Playlists retrieved successfully.',
  },
  ORDER: {
    CREATED: 'Song request placed in playback queue successfully.',
    QUEUE_EMPTY: 'Order queue is currently empty.',
    FETCHED: 'Order queue fetched successfully.',
  },
  STREAM: {
    INITIALIZED: 'Audio extraction pipeline initialized.',
    FAILED: 'Failed to extract audio stream from YouTube provider.',
  },
  SERVER: {
    INTERNAL_ERROR: 'An unexpected internal server error occurred.',
    SERVICE_HEALTHY: 'MyMusic Studio API service is fully operational.',
  },
};

module.exports = SYSTEM_MESSAGES;
