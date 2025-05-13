const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const token = authHeader.split(" ")[1];  // Extract token from header
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token

    req.user = { _id: decoded.user.id };  // Attach user ID to request object
    console.log("✅ Auth Middleware set req.user:", req.user);  // Debug log to see if it's set correctly

    next();  // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("❌ Error in JWT verification:", err);  // Log JWT errors
    return res.status(401).json({ msg: "Invalid token" });
  }
};
