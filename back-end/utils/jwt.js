const SECRETKEY = "031f101587525c6a374e6524dd43cc75"
const EXPIRES = "12h"

function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export { SECRETKEY, EXPIRES, parseJwt }