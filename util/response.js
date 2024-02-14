// utils/response.js

function successRes(res, data = null, statusCode = 200) {
    return res.status(statusCode).json(data);
  }
  
  function createdRes(res, data = null) {
    return successRes(res, data, 201);
  }
  
  function clientErrorRes(res, message = 'Bad Request', statusCode = 400) {
    return res.status(statusCode).json(message);
  }
  
  function notFoundRes(res, message = 'Not Found') {
    return clientErrorRes(res, message, 404);
  }
  
  function unauthorizedRes(res, message = 'Unauthorized') {
    return clientErrorRes(res, message, 401);
  }
  
  function forbiddenRes(res, message = 'Forbidden') {
    return clientErrorRes(res, message, 403);
  }

  function conflictErrorRes(res, message = 'Conflict') {
    return clientErrorRes(res, message, 409)
  }
  
  function serverErrorRes(res, message = 'Internal Server Error') {
    return res.status(500).json(message);
  }
  
  module.exports = {
    successRes,
    createdRes,
    clientErrorRes,
    notFoundRes,
    unauthorizedRes,
    forbiddenRes,
    conflictErrorRes,
    serverErrorRes,
  };
  