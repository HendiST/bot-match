/**
 * State Manager Module
 * Handles user registration states and flow
 */

// User states storage (in-memory for fast access)
const userStates = new Map();

// Registration states
const REGISTRATION_STATES = {
  IDLE: 'idle',
  WAITING_NAME: 'waiting_name',
  WAITING_AGE: 'waiting_age',
  WAITING_GENDER: 'waiting_gender',
  WAITING_PREFERENCE: 'waiting_preference',
  WAITING_CITY: 'waiting_city',
  WAITING_BIO: 'waiting_bio',
  WAITING_MEDIA: 'waiting_media'
};

// Action states
const ACTION_STATES = {
  NONE: 'none',
  SENDING_MESSAGE: 'sending_message',
  REPORTING_USER: 'reporting_user',
  EDITING_PROFILE: 'editing_profile',
  VIEWING_MATCHES: 'viewing_matches',
  BROWSING_LIKES: 'browsing_likes'
};

/**
 * Get user state
 */
function getState(userId) {
  return userStates.get(userId) || {
    regState: REGISTRATION_STATES.IDLE,
    actionState: ACTION_STATES.NONE,
    data: {},
    temp: {}
  };
}

/**
 * Set user state
 */
function setState(userId, state) {
  userStates.set(userId, {
    ...getState(userId),
    ...state
  });
}

/**
 * Update registration state
 */
function setRegState(userId, regState) {
  const currentState = getState(userId);
  setState(userId, {
    ...currentState,
    regState,
    actionState: ACTION_STATES.NONE
  });
}

/**
 * Update action state
 */
function setActionState(userId, actionState) {
  const currentState = getState(userId);
  setState(userId, {
    ...currentState,
    regState: REGISTRATION_STATES.IDLE,
    actionState
  });
}

/**
 * Update user data in state
 */
function updateData(userId, data) {
  const currentState = getState(userId);
  setState(userId, {
    ...currentState,
    data: {
      ...currentState.data,
      ...data
    }
  });
}

/**
 * Update temp data in state
 */
function updateTemp(userId, temp) {
  const currentState = getState(userId);
  setState(userId, {
    ...currentState,
    temp: {
      ...currentState.temp,
      ...temp
    }
  });
}

/**
 * Clear user state
 */
function clearState(userId) {
  userStates.delete(userId);
}

/**
 * Reset to idle
 */
function resetToIdle(userId) {
  setState(userId, {
    regState: REGISTRATION_STATES.IDLE,
    actionState: ACTION_STATES.NONE,
    data: {},
    temp: {}
  });
}

/**
 * Check if user is in registration
 */
function isInRegistration(userId) {
  const state = getState(userId);
  return state.regState !== REGISTRATION_STATES.IDLE;
}

/**
 * Check if user is performing action
 */
function isInAction(userId) {
  const state = getState(userId);
  return state.actionState !== ACTION_STATES.NONE;
}

module.exports = {
  userStates,
  REGISTRATION_STATES,
  ACTION_STATES,
  getState,
  setState,
  setRegState,
  setActionState,
  updateData,
  updateTemp,
  clearState,
  resetToIdle,
  isInRegistration,
  isInAction
};
