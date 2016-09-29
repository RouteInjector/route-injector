/*
HTTP Status Codes
Top 10" HTTP Status Code. More REST service-specific information is contained in the entry.
http://www.restapitutorial.com/httpstatuscodes.html
*/

module.exports = 
{

    ///////////////////////////////////////////2XX SUCCESS///////////////////////////////////////////////////
    /*Standard response for successful HTTP requests. The actual response will depend on the request method
     used. In a GET request, the response will contain an entity corresponding to the requested resource.
     In a POST request the response will contain an entity describing or containing the result of the action*/
    OK:function()
    {
	    return 200;
    },
    //The request has been fulfilled and resulted in a new resource being created
    Created:function()
    {
	    return 201;
    },

    /*The server successfully processed the request, but is not returning any content.
    Usually used as a response to a successful delete request. Also returned for requests
     containing the If-Modified-Since header if the document is up-to-date.*/
    NoContent:function()
    {
        return 204;
    },

    MovedPermanently:function()
    {
        return 301;
    },

    Found:function()
    {
        return 302;
    },

    NotModified:function()
    {
        return 304;
    },
    ///////////////////////////////////////////4XX CLIENT ERROR///////////////////////////////////////////////////

    //The request cannot be fulfilled due to bad syntax
    BadRequest:function()
    {
	    return 400;
    },

    /*Similar to 403 Forbidden, but specifically for use when authentication is required 
    and has failed or has not yet been provided.[2] The response must include a WWW-Authenticate
    header field containing a challenge applicable to the requested resource*/
    Unauthorized:function()
    {
	    return 401;
    },

    /*The request was a valid request, but the server is refusing to respond to it. Unlike a 401 
    Unauthorized response, authenticating will make no difference.*/
    Forbidden:function()
    {
	    return 403;
    },

    /*The requested resource could not be found but may be available again in the future.
    Subsequent requests by the client are permissible.*/
    NotFound:function()
    {
	    return 404;
    },

    /*A request was made of a resource using a request method not supported by that resource;
    for example, using GET on a form which requires data to be presented via POST, or using PUT 
    on a read-only resource.*/
    MethodNotAllowed:function()
    {
	    return 405;
    },

    /*Indicates that the request could not be processed because of conflict in the request, such as an 
    edit conflict in the case of multiple updates.*/
    Conflict:function()
    {
	    return 409;
    },

    ///////////////////////////////////////////////////5xx Server Error////////////////////////////

    /*A generic error message, given when an unexpected condition was encountered and no more specific
     message is suitable*/
    InternalServerError:function()
    {
	    return 500;
    }
};

