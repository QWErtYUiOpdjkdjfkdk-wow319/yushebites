import { useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const Root = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === "admin") {
                navigate("/admin-dashboard");
            } else if (user.role === "customer") {
                navigate("/employee-dashboard");
            } else {
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
            <h2 style={{ fontFamily: "sans-serif", color: "#333" }}>
                Checking authentication... Redirecting you now.
            </h2>
        </div>
    );
}

export default Root;