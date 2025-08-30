import * as gmpDatabaseService from './gmpDatabaseService';
import * as mcDatabaseService from './mcDatabaseService';
import * as fsqmDatabaseService from './fsqmDatabaseService';

/**
 * Database service selector that returns the appropriate service based on environment
 * @param {string} environment - The environment to select (GMP, MC, FSQM)
 * @returns {Object} - The appropriate database service
 */
export const getDatabaseService = (environment = 'GMP') => {
  switch (environment.toUpperCase()) {
    case 'GMP':
      return gmpDatabaseService;
    case 'MC':
      return mcDatabaseService;
    case 'FSQM':
      return fsqmDatabaseService;
    default:
      console.warn(`Unknown environment: ${environment}. Defaulting to GMP.`);
      return gmpDatabaseService;
  }
};

/**
 * Convenience functions that automatically select the right service
 */

export const fetchStageData = (email = null, limit = null, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.fetchStageData(email, limit);
};

export const fetchUserStageData = (email, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.fetchUserStageData(email);
};

export const checkEvaluationExists = (email, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.checkEvaluationExists(email);
};

export const saveEvaluationResults = (evaluationData, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.saveEvaluationResults(evaluationData);
};

export const updateEvaluationResults = (email, updateData, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.updateEvaluationResults(email, updateData);
};

export const saveEvaluationError = (email, errorMessage, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.saveEvaluationError(email, errorMessage);
};

export const logProcessEvent = (eventData, environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.logProcessEvent(eventData);
};

export const getProcessedEmails = (environment = 'GMP') => {
  const service = getDatabaseService(environment);
  return service.getProcessedEmails();
};

// Export individual services for direct access if needed
export { gmpDatabaseService, mcDatabaseService, fsqmDatabaseService };
