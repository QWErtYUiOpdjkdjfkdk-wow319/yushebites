// Use after authMiddleware: only users with role "admin" may continue.
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admins only" });
    }
    next();
};

export default adminOnly;
