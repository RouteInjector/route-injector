/**
 * Created by gerard on 27/01/16.
 */
import RiResponse = require("./Response");
class InternalServerError extends RiResponse {

    constructor(){
        super("Internal Server Error", "");
    }

    constructor(msg:string) {
        super("Internal Server Error", msg);
    }

    public getStatusCode() {
        return 500;
    }
}
export = InternalServerError;