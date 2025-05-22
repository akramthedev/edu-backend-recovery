const tryCatchHandler = (fun) => {
    return async (req, res, next) => {
        try {
            await fun(req, res);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({
                message: error.message,
                error: error.message,
            });
        }
    };
};

module.exports = tryCatchHandler;
