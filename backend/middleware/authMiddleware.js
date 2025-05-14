const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  //Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID from token to request
    req.user = decoded.user.id;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

