import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please log in to perform this action.' })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, name: payload.name, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Session expired or token is invalid. Please log in again.' })
  }
}
