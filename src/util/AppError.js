
module.exports = class AppError extends Error {

    constructor(message='Error', status=500) {
        if (!Number.isInteger(status)) { status = 500 }
        super(message)
        this.status = status
    }

}