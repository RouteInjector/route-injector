class HooksUtils {

    public static funcMerge = (funcArray) => {

        return async (doc, cb, state) => {
            var result = doc;
            for (var func of funcArray) {
                result = await new Promise((resolve) => {
                    func(result, resolve, state);
                });

                if (!result) return cb(result);
            }

            return cb(result);
        };
    }

    public static iterateCursor = async (cursor, limit, func, ctx) => {
        var partial = [];
        var state: any = ctx;

        try {
            let doc = await cursor.next(), next;

            if (doc)
                next = limit > 1 ? await cursor.next() : null;

            state.ctx.hasNext = !!next;

            while (doc) {
                if (limit > 0) {
                    var result = await new Promise((resolve) => {
                        func(doc, resolve, state);
                    });

                    if (result) {
                        limit--;
                        partial.push(result);
                    }

                    doc = next;
                    next = limit > 1 ? await cursor.next() : null;
                    state.ctx.hasNext = !!next;

                } else {
                    return state.result || partial;
                }
            }

            return state.result || partial;
        } catch (err) {
            return state.result || partial;
        }
    };
}

export = HooksUtils;