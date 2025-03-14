const userController = require('./userController');
const authController = require('./authController');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  try {
    const { httpMethod, body, requestContext } = event;
    const rawPath = requestContext.http.path;
    const pathSegments = rawPath.split('/').filter(segment => segment);
    
    if (pathSegments.length < 2) {
      return createResponse(400, { message: 'Invalid API path' });
    }

    const version = pathSegments[0]; // e.g., 'v1'
    const resource = pathSegments[1]; // e.g., 'user' or 'auth'
    const action = pathSegments.length > 2 ? pathSegments[2] : null;
    const id = pathSegments.length > 3 ? pathSegments[3] : null;
    const parsedBody = body ? JSON.parse(body) : {};
    
    let response;

    switch (resource) {
      case 'auth':
        response = await handleAuthActions(action, parsedBody);
        break;
      case 'user':
        response = await handleUserActions(httpMethod, action, id, parsedBody, event.headers);
        break;
      default:
        return createResponse(404, { message: 'Resource not found' });
    }
    
    return createResponse(200, response);
  } catch (error) {
    console.error('Error:', error);
    return createResponse(error.statusCode || 500, { message: error.message || 'An unexpected error occurred' });
  }
};

const handleAuthActions = async (action, parsedBody) => {
  switch (action) {
    case 'login':
      return await authController.login(parsedBody);
    case 'signup':
      return await authController.signup(parsedBody);
    case 'verify-recovery-words':
      return await authController.verifyRecoveryWords(parsedBody);
    case 'reset-password':
      return await authController.resetPassword(parsedBody);
    default:
      throw { statusCode: 400, message: 'Unsupported auth action' };
  }
};

const handleUserActions = async (httpMethod, action, id, parsedBody, headers) => {
  if (httpMethod !== 'OPTIONS') {
    const token = extractToken(headers);
    await authController.verifyToken(token);
  }

  switch (httpMethod) {
    case 'GET':
      return action === 'profile' ? await userController.getUserProfile(extractToken(headers)) :
        action ? await userController.getUserById(action) :
        await userController.getAllUsers();
    case 'POST':
      return await userController.createUser(parsedBody);
    case 'PUT':
      return action === 'profile' ? await userController.updateUserProfile(extractToken(headers), parsedBody) :
        action ? await userController.updateUser(action, parsedBody) :
        { message: 'Invalid update endpoint' };
    case 'DELETE':
      return await userController.deleteUser(action);
    case 'OPTIONS':
      return '';
    default:
      throw { statusCode: 400, message: 'Unsupported method' };
  }
};

const extractToken = (headers) => {
  const authHeader = headers?.Authorization || headers?.authorization;
  if (!authHeader) throw { statusCode: 401, message: 'No authorization token provided' };
  return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
};

const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
    },
    body: JSON.stringify(body)
  };
};