/**
 * Created by gerard on 27/01/16.
 */
/// <reference path='../../typings/index.d.ts'/>
abstract class RiResponse {

    private error;
    private message;

    constructor(title, msg) {
        this.error = title;
        this.message = msg;
    }

    public abstract getStatusCode();

    public toJson() {
        return {
            error: this.error,
            message: this.message
        }
    }
}

export = RiResponse;