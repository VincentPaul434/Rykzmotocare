function admin(req, res, next) {
  // Example: check if user is admin
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
}

module.exports = admin;