/**
 * Created by gerard on 08/02/16.
 */
class ArgumentUtils {
    private static args = require('minimist')(process.argv.slice(2));

    public static getArguments():string[] {
        return Object.keys(ArgumentUtils.args);
    }

    public static exists(string):boolean {
        return ArgumentUtils.args[string] ? true : false;
    }

    public static getValue(argumentName):any{
        return ArgumentUtils.args[argumentName];
    }
}
export = ArgumentUtils;