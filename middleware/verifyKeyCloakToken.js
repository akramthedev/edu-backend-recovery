const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const dotenv = require("dotenv");
dotenv.config();


const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}/protocol/openid-connect/certs`
});




function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}




function verifyKeycloakToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.REALM}`
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const realmRoles = decoded.realm_access?.roles || [];
    req.user = {
      ...decoded,
      roles: realmRoles,
    };
    next();
  });
}



module.exports = verifyKeycloakToken