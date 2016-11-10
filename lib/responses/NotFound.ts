/**
 * Created by gerard on 27/01/16.
 */
/// <reference path='../../typings/index.d.ts'/>
import RiResponse = require("./Response");
class NotFound extends RiResponse {

    constructor(msg:string) {
        super("Not Found", msg);
    }

    public getStatusCode() {
        return 404;
    }
}
export = NotFound;