const userController = require('./userController');

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));
  
  try { 
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(segment => segment);
    const userId = pathSegments.length > 1 ? pathSegments[1] : null;
    const parsedBody = body ? JSON.parse(body) : {};
    
    let response;
     
    switch(httpMethod) {
      case 'GET':
        if (userId) {
          response = await userController.getUserById(userId);
        } else {
          response = await userController.getAllUsers();
        }
        break;
      case 'POST':
        response = await userController.createUser(parsedBody);
        break;
      case 'PUT':
        response = await userController.updateUser(userId, parsedBody);
        break;
      case 'DELETE':
        response = await userController.deleteUser(userId);
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Unsupported method' })
        };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: error.message || 'An unexpected error occurred'
      })
    };
  }
};
