const userController = require('./userController');
const authController = require('./authController');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  try {
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(segment => segment);
    const resource = pathSegments[0];
    const action = pathSegments.length > 1 ? pathSegments[1] : null;
    const id = pathSegments.length > 2 ? pathSegments[2] : null;
    const parsedBody = body ? JSON.parse(body) : {};
    
    let response;
    
    if (resource === 'auth') {
      switch(action) {
        case 'login':
          response = await authController.login(parsedBody);
          break;
        case 'signup':
          response = await authController.signup(parsedBody);
          break;
        case 'verify-recovery-words':
          response = await authController.verifyRecoveryWords(parsedBody);
          break;
        case 'reset-password':
          response = await authController.resetPassword(parsedBody);
          break;
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported auth action' })
          };
      }
    } else if (resource === 'users') {
      if (httpMethod !== 'OPTIONS') {
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader) {
          return {
            statusCode: 401,
            body: JSON.stringify({ message: 'No authorization token provided' })
          };
        }
        
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
        
        try {
          await authController.verifyToken(token);
        } catch (error) {
          return {
            statusCode: 401,
            body: JSON.stringify({ message: error.message })
          };
        }
      }
      
      switch(httpMethod) {
        case 'GET':
          if (action === 'profile') {
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            response = await userController.getUserProfile(token);
          } else if (action) {
            response = await userController.getUserById(action);
          } else {
            response = await userController.getAllUsers();
          }
          break;
        case 'POST':
          response = await userController.createUser(parsedBody);
          break;
        case 'PUT':
          if (action === 'profile') {
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            response = await userController.updateUserProfile(token, parsedBody);
          } else if (action) {
            response = await userController.updateUser(action, parsedBody);
          } else {
            return {
              statusCode: 400,
              body: JSON.stringify({ message: 'Invalid update endpoint' })
            };
          }
          break;
        case 'DELETE':
          response = await userController.deleteUser(action);
          break;
        case 'OPTIONS':
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
            },
            body: ''
          };
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported method' })
          };
      }
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE'
      },
      body: JSON.stringify({
        message: error.message || 'An unexpected error occurred'
      })
    };
  }
};

